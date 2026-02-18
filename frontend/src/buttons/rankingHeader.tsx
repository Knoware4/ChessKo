import { FaChessBoard, FaPuzzlePiece } from "react-icons/fa";


interface RankingHeaderProps {
	setOrderByFunction: React.Dispatch<React.SetStateAction<number>>,
}


export const RankingHeader = ({ setOrderByFunction }: RankingHeaderProps) => {
	return (
		<div 
            className="flex justify-center mt-6">
			<div 
                className="bg-primary text-white grid grid-cols-10 text-sm font-semibold rounded-t-lg overflow-hidden shadow-md w-full max-w-5xl">
				<RankingHeaderItem 
                    className="col-span-2 justify-start pl-4" number={0} setOrderBy={setOrderByFunction} >
					Nickname
				</RankingHeaderItem>

				<RankingHeaderItem 
                    number={1} setOrderBy={setOrderByFunction}>Classic <FaChessBoard className="w-4 h-4 ml-1" title="Classic chess" />
                </RankingHeaderItem>
				<RankingHeaderItem 
                    number={2} setOrderBy={setOrderByFunction}>Rapid <FaChessBoard className="w-4 h-4 ml-1" title="Classic chess" />
                </RankingHeaderItem>
				<RankingHeaderItem
                    number={3} setOrderBy={setOrderByFunction}>Blitz <FaChessBoard className="w-4 h-4 ml-1" title="Classic chess" />
                </RankingHeaderItem>
				<RankingHeaderItem
                    number={4} setOrderBy={setOrderByFunction}>Bullet <FaChessBoard className="w-4 h-4 ml-1" title="Classic chess" />
                </RankingHeaderItem>

				<RankingHeaderItem
                    number={5} setOrderBy={setOrderByFunction}>Classic <FaPuzzlePiece className="w-4 h-4 ml-1" title="Special chess" />
                </RankingHeaderItem>
				<RankingHeaderItem
                    number={6} setOrderBy={setOrderByFunction}>Rapid <FaPuzzlePiece className="w-4 h-4 ml-1" title="Special chess" />
                </RankingHeaderItem>
				<RankingHeaderItem
                    number={7} setOrderBy={setOrderByFunction}>Blitz <FaPuzzlePiece className="w-4 h-4 ml-1" title="Special chess" />
                </RankingHeaderItem>
				<RankingHeaderItem
                    number={8} setOrderBy={setOrderByFunction}>Bullet <FaPuzzlePiece className="w-4 h-4 ml-1" title="Special chess" />
                </RankingHeaderItem>
			</div>
		</div>
	)
}

interface RankingHeaderItemProps {
	className?: string,
	children: React.ReactNode,
	number: number,
	setOrderBy: React.Dispatch<React.SetStateAction<number>>,
}

export const RankingHeaderItem = ({ className, children, setOrderBy, number }: RankingHeaderItemProps) => {
	return (
		<button
            className={`flex items-center justify-center px-3 py-2 border-r border-white/20 ${className ?? ""}`}
			onClick={() => setOrderBy(number)}>
			{children}
		</button>
	)
}
