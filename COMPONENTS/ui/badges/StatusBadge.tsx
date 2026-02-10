export const StatusBadge = ({ color, status }: { color: string, status: string }) => {
    return (
        <div className={`bg-${color}-200 border border-${color}-800 text-${color}-800 rounded-full px-2 py-1 whitespace-nowrap`}>
            { status }
        </div>
    )
}