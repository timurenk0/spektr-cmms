"use client"


import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import tippy from "tippy.js";
import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, selectClasses, Slide, TextField } from "@mui/material";
import React from "react";
import { TransitionProps } from "@mui/material/transitions";
import { Check, X } from "lucide-react";
import { format } from "date-fns";
import { EventClickArg } from "@fullcalendar/core/index.js";
import { useAuth } from "@/COMPONENTS/utils/authContext";
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

const MyCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventClickArg["event"] | null>();

  console.log(selectedEvent);
  
  const { data: mEvents, isLoading: isLoadingMEvents } = useQuery({
    queryKey: ["/api/maintenance-events"]
  });

  const { user, isLoading: isLoadingUser } = useAuth();


  const isLoading = (!mEvents || isLoadingMEvents) || (!user || isLoadingUser);

  if (isLoading) return (
    <h1>Loading...</h1>
  )

  return (
    <>
      <FullCalendar
          plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
          events={mEvents}
          headerToolbar={{
            left: "prev next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          contentHeight={"100vh"}
          stickyHeaderDates
          dayMaxEvents={2}
          eventDidMount={(info) => {
            tippy(info.el, {
              content: `
                <div style="
                  padding: 4px 8px;
                  background-color: #f3f3f3;
                  border: 1px solid #ccc;
                  border-radius: 4px;
                ">
                  <strong>${info.event.title}</strong><br/>
                  <em><small>${info.event.extendedProps.description}</small></em><br/>
                  <small>Status: ${info.event.extendedProps.status}</small>
                </div>
                `,
                allowHTML: true,
                placement: "top",
              })
            }}
            eventClick={(e) => setSelectedEvent(e.event)}
      />

      {(selectedEvent && user.role === "admin" && selectedEvent._def.extendedProps.status === "upcoming") && <EventForm event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </>
  )
}

export default MyCalendar;