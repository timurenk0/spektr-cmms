"use client"

import { EventClickArg } from "@fullcalendar/core/index.js";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide, TextField } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const EventForm = ({ event, onClose }: { event: EventClickArg["event"]; onClose: () => void; }) => {
  const [completionDate, setCompletionDate] = useState(format(event.start!, "yyyy-MM-dd"));
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (type: string) => {
      try {
        const response = await fetch(`/api/maintenance-events/${event._def.publicId}`, {
          method: "PUT",
          body: JSON.stringify({
            status: type,
            performedAt: format(completionDate, "yyyy-MM-dd")
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

  const onSubmit = (type: string) => {
    mutation.mutate(type);
  }

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
        <DialogTitle fontWeight={600} className="flex justify-between">
          Update Event
        </DialogTitle>
        <DialogContent className="flex flex-col gap-y-4">
          <DialogContentText>
            Are you sure you want to edit "{event.extendedProps.description}" event? If you want to mark event <em>complete</em>, please choose the date of completion.
          </DialogContentText>
          <TextField
            label="Completion Date"
            type="date"
            color="info"
            margin="dense"
            value={completionDate}
            required
            fullWidth
            onChange={(e) => setCompletionDate(format(e.target.value, "yyyy-MM-dd"))}
          />
        <DialogActions>
          <Button variant="text" onClick={() => onSubmit("complete")}>
            <Check /> {mutation.isPending ? "Submitting..." : "Complete"}
          </Button>
          <Button variant="text" color="error" onClick={() => onSubmit("incomplete")}>
            <X /> {mutation.isPending ? "Submitting..." : "Incomplete"}
          </Button>
        </DialogActions>
        </DialogContent>
      </Dialog>
    );
  };


export default EventForm;