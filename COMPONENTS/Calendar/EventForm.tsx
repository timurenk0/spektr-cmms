"use client"

import { EventClickArg } from "@fullcalendar/core/index.js";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormLabel, InputAdornment, Radio, RadioGroup, Slide, TextField } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, FileIcon, X } from "lucide-react";
import React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<unknown, React.JSXElementConstructor<React.ReactNode>> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EventForm = ({ event, onClose }: { event: EventClickArg["event"]; onClose: () => void; }) => {
  const [eventStatus, setEventStatus] = useState("");
  const [documentUploading, setDocumentUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [completionDate, setCompletionDate] = useState(event.end?.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  console.log(eventStatus);
  

  const uploadDocument = async () => {
    setDocumentUploading(true);
    try {
      if (!file) throw new Error("No file found");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("rawEquipmentId", event._def.extendedProps.equipmentId);
      formData.append("title", `Maintenance report ${completionDate}`);
      formData.append("category", "maintenance");
      formData.append("notes", event._def.extendedProps.description);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Failed to upload event certificate: ${data.error}`);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setDocumentUploading(false);
    } 
  }
  
  const mutation = useMutation({
    mutationFn: async (status: string) => {
      try {
        const response = await fetch(`/api/maintenance-events/${event._def.publicId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status,
            performedAt: format(completionDate, "yyyy-MM-dd"),
            reason: reason.trim()
          }),
          credentials: "include"
        });

        const data = await response.json().catch(() => null);
        console.log(data);

        if (!response.ok) {
          const message = data.error || `Request failed: ${response.status} ${response.statusText}`;
          throw new Error(message);
        }

        return data;        
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        throw new Error(msg);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/maintenance-events/${event._def.publicId}`] });
      toast.success("Maintenance event updated successfully", {
        duration: 2000,
        position: "bottom-right",
        icon: "✅"
      });
      onClose();
      window.location.reload();
    },
    onError: (error) => {
      console.error(error.cause, error.stack);
      toast.error(`Failed to update maintenance event: ${error.message}`, {
        duration: 2000,
        position: "bottom-right",
        icon: "❌"
      });
    }
  });

  const onSubmit = async () => {
    if (!eventStatus) {
      toast.dismiss();
      toast.error("Assign status first!");
      return;
    }

    
    if (eventStatus === "complete") {
      if (!file) {
        toast.dismiss();
        toast.error("Upload file first!");
        return;
      }

      const doc = await uploadDocument();
      if (!doc) {
        toast.dismiss();
        toast.error("Failed to upload document. Please try again.");
        return;
      }      
    } else if (eventStatus === "incomplete") {
      if (reason.trim().length < 3) {
        toast.dismiss()
        toast.error("Reason statement should be at least 3 characters long!");
        return;
      }
    }
    mutation.mutate(eventStatus);
  }

  const isPending = (mutation.isPending || documentUploading);
  
    return (
      <Dialog
        open={!!event}
        slots={{
          transition: Transition
        }}
        keepMounted
        onClose={onClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className="flex justify-between font-bold">
          Update Event
        </DialogTitle>
        <DialogContent className="flex flex-col gap-y-4">
          <DialogContentText>
            Are you sure you want to edit &quot;{event.extendedProps.description}&quot; event? If you want to mark event <em>complete</em>, please choose the date of completion.
          </DialogContentText>
          <FormControl required>
            <FormLabel><p className="text-black inline">Set Event Status</p></FormLabel>
            <RadioGroup onChange={(e) => {
              setEventStatus(e.target.value)
            }}>
              <FormControlLabel value="complete" control={<Radio/>} label="Complete" />
              <FormControlLabel value="incomplete" control={<Radio/>} label="Incomplete" />
            </RadioGroup>
          </FormControl>
          { eventStatus === "complete" && (
            <>
              <p className="text-black/50 text-sm">Select event completion date and upload completion confirmation report below:</p>
              <TextField
                label="Completion Date"
                type="date"
                color="info"
                margin="dense"
                value={completionDate}
                slotProps={{
                  htmlInput: event._def.extendedProps.level === "E" ? { min: event.startStr } : {}
                }}
                required
                fullWidth
                onChange={(e) => setCompletionDate(format(e.target.value, "yyyy-MM-dd"))}
              />
              <TextField
                type="file"
                color="info"
                margin="dense"
                fullWidth
                required
                slotProps={{
                  htmlInput: {
                    accept: "application/pdf",
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (!file) throw new Error("No file found");

                      if (file.size > 1024*1024*10) {
                        toast.dismiss();
                        toast.error("File size should not exceed 10MB!", {
                          icon: "⚠️"
                        });
                        e.target.value = "";
                        return;
                      }
                      
                      setFile(file);
                    }
                  },
                  input: {
                    endAdornment: <InputAdornment position="end"><FileIcon /></InputAdornment>
                  }
                }}
              />
            </>
          ) }
          { eventStatus === "incomplete" && (
            <>
              <p>Type the reason why event is marked as incomplete</p>
              <TextField
                label="Reason"
                color="info"
                margin="dense"
                value={reason}
                multiline
                slotProps={{
                  htmlInput: { minLength: 3, maxLength: 511 }
                }}
                rows={4}
                required
                fullWidth
                onChange={e => setReason(e.target.value)}
              />
            </>
          ) }
        <DialogActions>
          <Button type="submit" variant="text" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Submit"}
          </Button>
          <Button variant="text" color="error" onClick={onClose}>
            Cancel
          </Button>
        </DialogActions>
        </DialogContent>
      </Dialog>
    );
  };


export default EventForm;