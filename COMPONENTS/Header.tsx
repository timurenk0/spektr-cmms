import { Menu } from 'lucide-react'


const Header = ({ title }: { title: string }) => {
  return (
    <header className={`bg-white shadow-sm top-0 z-10 ${title==="Calendar" && "sticky"}`}>
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
                <button className="mr-2 text-gray-600 lg:hidden">
                    <Menu className='h-6 w-6' />
                </button>

                <div className="flex-items-center">
                    <h2 className='text-lg font-semibold text-gray-800'>{title}</h2>
                </div>
            </div>

            {title === "Calendar" && (
                <div className="flex items-center space-x-4 pointer-events-none">
                    <div className="bg-emerald-400 px-2 rounded-lg">
                        <p>Level A Event</p>
                    </div>
                    <div className="bg-yellow-400 px-2 rounded-lg">
                        <p>Level B Event</p>
                    </div>
                    <div className="bg-blue-400 px-2 rounded-lg">
                        <p>Level C Event</p>
                    </div>
                    <div className="bg-purple-400 px-2 rounded-lg">
                        <p>Level D Event</p>
                    </div>
                    <div className="bg-orange-400 px-2 rounded-lg">
                        <p>Certification Event</p>
                    </div>
                    <div className="police-tape px-2 rounded-lg">
                        <p>Emergency Event</p>
                    </div>
                    <div className="bg-violet-400 px-2 rounded-lg">
                        <p>Overhaul Event</p>
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-4">
                Empty
            </div>
        </div>
    </header>
  )
}

export default Header