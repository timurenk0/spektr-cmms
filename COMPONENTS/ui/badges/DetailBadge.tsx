export const DetailBadge = ({ text }: { text: string }) => {
    return (
        <div className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
            { text }
        </div>
    )
}