import { Header } from "../header/header";


export const Layout = (props: { children: React.ReactNode }) => {
    return (
        <div 
            className="flex flex-col min-h-screen">
            <Header />
            <div
                className="flex flex-col w-full">
                {props.children}
            </div>
        </div>
    )
}
