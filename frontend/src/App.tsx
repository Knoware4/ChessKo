import './App.css';
import { Layout } from './components/layout';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Users } from './pages/users';
import { ClassicGame } from './pages/game';
import { createContext, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Player } from './types/player';
import { Socket } from 'socket.io-client';
import { Tournaments } from './pages/tournaments';
import { useFirebaseUser } from './hooks/useFirebaseUser';
import { usePlayerByEmail } from './hooks/usePlayer';
import { useSocket } from './hooks/useSocket';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';
import { PageNotFound } from './components/pageNotFound';
import { SpecialChess } from './pages/specialChess';
import { useServerIsAlive } from './hooks/useServer';
import { Error } from "./components/error"
import { Loading } from './components/loading';
import { TournamentPage } from './pages/tournamentPage';
import { Register } from './pages/register';
import { Home } from './pages/home';
import { SpecialChessGame } from './pages/specialChessGame';
import { UserPage } from './pages/userPage';


type ContextType = {
	firebaseUser: User | null;
	player: Player | undefined;
	socket: Socket | null;
	refreshPlayer: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<Player, Error>>;
};

export const Context = createContext<ContextType>({
	firebaseUser: null,
	player: undefined,
	socket: null,
	refreshPlayer: async () => {
		return {
			data: undefined,
			error: null,
			isError: false,
			isFetching: false,
			isLoading: false,
			isPending: false,
			isRefetching: false,
			isSuccess: false,
			refetch: async () => ({} as any),
			status: "success",
			fetchStatus: "idle",
		} as any;
	},
});


function AppInner() {
	const { firebaseUser } = useFirebaseUser();
	const email = firebaseUser?.email ?? null;
	const { data: player, refetch: refreshPlayer } = usePlayerByEmail(email);
	const socket = useSocket(player);
	const location = useLocation();

    
	useEffect(() => {
		refreshPlayer();
	}, [location.pathname, refreshPlayer]);


	const { data: status, isLoading, error } = useServerIsAlive();

	if (isLoading) return <Loading />
	if (status !== "OK" || error) return <Error />

	return (
		<Context.Provider
			value={{
				firebaseUser,
				player,
				socket,
				refreshPlayer,
			}}
		>
			<Layout>
				<Routes location={location} key={location.pathname}>
					<Route path='/' element={<Home />} />
					{player && <Route path='/users/:id' element={<UserPage />} />}
					{player && <Route path='/users' element={<Users />} />}
					{player && <Route path='/games/:id' element={<ClassicGame />} />}
					{player && <Route path='/tournaments/:id' element={<TournamentPage />} />}
					{player && <Route path='/tournaments' element={<Tournaments />} />}
					{player && <Route path='/special/:id' element={<SpecialChessGame />} />}
					{player && <Route path='/special' element={<SpecialChess />} />}
					<Route path='/register' element={<Register />} />
					<Route path='*' element={<PageNotFound />} />
				</Routes>
			</Layout>
		</Context.Provider>
	);
}

export default function App() {
	return (
		<div className='w-screen h-screen'>
			<BrowserRouter>
				<AppInner />
			</BrowserRouter>
		</div>
	);
}
