export const DetailBadge = ({ name, text }: { name: string, text: string }) => {
    return (
        <div className="flex flex-col items-center">
            <span className="text-xs text-gray-500 mb-1">{name}</span>
            <div title={text} className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-bold rounded-full max-w-md truncate">
                { text }
            </div>
        </div>
    )
}