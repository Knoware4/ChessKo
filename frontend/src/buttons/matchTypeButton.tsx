import { useFormContext } from "react-hook-form";
import { CreateGameFormType } from "../types/forms/createGameForm";
import { SpecialChessForm } from "../types/forms/specialChessForm";


export const MatchTypeButton = () => {
	const { setValue, watch } = useFormContext<CreateGameFormType | SpecialChessForm>()

	return (
		<div 
            className="inline-flex rounded-xl overflow-hidden border border-gray-400">
			<button
				className={`px-4 py-2 transition-colors ${watch("matchType") === "RATED"
					? "bg-primary text-white"
					: "bg-white text-gray-700 hover:bg-gray-100"
					}`}
				type="button"
				onClick={() => setValue("matchType", "RATED")}
			>
				Rated
			</button>
			<button
				className={`px-4 py-2 transition-colors ${watch("matchType") === "FRIENDLY"
					? "bg-primary text-white"
					: "bg-white text-gray-700 hover:bg-gray-100"
					}`}
				type="button"
				onClick={() => setValue("matchType", "FRIENDLY")}
			>
				Friendly
			</button>
		</div>
	);
};
