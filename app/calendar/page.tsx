"use client"

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction";
import tippy from "tippy.js";
import { useCallback, useState } from "react";
import React from "react";
import { EventClickArg, EventInput, EventSourceFuncArg } from "@fullcalendar/core/index.js";
import { useAuth } from "@/COMPONENTS/utils/authContext";
import EventForm from "@/COMPONENTS/Calendar/EventForm";
import { useQuery } from "@tanstack/react-query";



type MEvent = {
  id: number,
  tenantId: number,
  equipmentId: number,
  maintenanceId: number,
  title: string,
  description: string,
  level: string,
  start: string,
  end: string,
  scheduledAt: string,
  performedAt: string | null,
  status: string,
  color: string
}

const MyCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventClickArg["event"] | null>();
  
  const fetchEvents = useCallback(
    async (fetchInfo: EventSourceFuncArg, successCallback: (events: EventInput[]) => void, failureCallback: (error: Error) => void) => {
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


  const loading = (!user || isLoadingUser);

  if (loading) return (
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
                  ${info.event.extendedProps.isOverdue ? "<small style='color: #ff0000'>Overdue</small>" : `<small>Complete: ${info.event.extendedProps.isComplete ? "✅" : "❌"}</small>`}
                </div>
                `,
                allowHTML: true,
                placement: "top",
              })
            }}
            eventClick={(e) => {
              (e.event._def.extendedProps.isComplete || e.event._def.extendedProps.isOverdue)  ? console.log("Incomplete event") : setSelectedEvent(e.event);
            }}
      />

      {(selectedEvent && user.role === "admin") && <EventForm event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </>
  )
}

export default MyCalendar;