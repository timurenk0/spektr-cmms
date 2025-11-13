"use client"

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction";
import tippy from "tippy.js";
import { useCallback, useState } from "react";
import React from "react";
import { EventClickArg } from "@fullcalendar/core/index.js";
import { useAuth } from "@/COMPONENTS/utils/authContext";
import EventForm from "@/COMPONENTS/Calendar/EventForm";



const MyCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventClickArg["event"] | null>();
  
  const fetchEvents = useCallback(
    async (fetchInfo: any, successCallback: (x: any) => void, failureCallback: (x: any) => void) => {
      try {
        const res = await fetch(`/api/maintenance-events?start=${fetchInfo.startStr.slice(0, 10)}&end=${fetchInfo.endStr.slice(0, 10)}`);
        const data = await res.json();
  
        successCallback(data);
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        failureCallback(err);
      }
    },
    []
  );
  const { user, isLoading: isLoadingUser } = useAuth();


  const isLoading = (!user || isLoadingUser);

  if (isLoading) return (
    <h1>Loading...</h1>
  )

  return (
    <>
      <FullCalendar
          plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
          events={fetchEvents}
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
            eventClick={(e) => {
              e.event._def.extendedProps.status === "upcoming" || e.event._def.extendedProps.status === "overdue" ? setSelectedEvent(e.event) : console.log("Incomplete event");
            }}
      />

      {(selectedEvent && user.role === "admin") && <EventForm event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </>
  )
}

export default MyCalendar;