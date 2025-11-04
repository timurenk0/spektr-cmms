import GaugeChart from "./Charts/GaugeChart"


const CHARTINFO = [
    {
        title: "Maintenance Schedule Compliance (MSC)",
        subtitle: "Target > 90%",
        value: 100,
        class: "msc"

    },
    {
        title: "Planned Maintenance Percentage (PMP)",
        subtitle: "Target > 85%",
        value: 100,
        class: "pmp"

    },
    {
        title: "Timely Completed Maintenances (TCM)",
        subtitle: "Target > 90%",
        value: 100,
        class: "tcm"

    },
    {
        title: "Equipment Health Index (EHI)",
        subtitle: "Target > 75%",
        value: 100,
        class: "ehi"

    },
]

const GaugeCharts = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {CHARTINFO.map((ci, idx) => (
            <GaugeChart key={idx} value={ci.value} title={ci.title} subtitle={ci.subtitle} colorClass={ci.class} statClass={ci.class} />
        ))}
    </div>
  )
}

export default GaugeCharts;