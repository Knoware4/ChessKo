import { PaginationButton } from "../buttons/paginationButton";


interface PaginationProps {
    page: number,
    setPage: (page: number) => void,
    maxPages: number,
}


export const Pagination = ({ page, setPage, maxPages }: PaginationProps) => {
    return (
        <div 
            className="flex justify-between">
            <PaginationButton disabled={page < 1} setPage={() => setPage(page - 1)} text="Prev" />
            <PaginationButton disabled={page >= maxPages} setPage={() => setPage(page + 1)} text="Next" />
        </div>
    )
}
