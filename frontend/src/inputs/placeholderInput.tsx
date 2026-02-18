import type { FieldValues, Path, UseFormRegister } from "react-hook-form";


interface PlaceholderInputProps<TForm extends FieldValues> {
	valueName: Path<TForm>,
	placeholderText: string,
	register: UseFormRegister<TForm>,
	isRequired?: boolean,
	isNum?: boolean,
	isPwd?: boolean,
}


export const PlaceholderInput = <TForm extends FieldValues>({ register, valueName, isRequired = false, placeholderText, isNum = false, isPwd = false }: PlaceholderInputProps<TForm>) => {
	return (
		<div
            className="relative w-full">
			<input
				className="peer w-full rounded-xl border border-zinc-300 bg-transparent px-4 pb-3 pt-5 text-base
                   outline-none transition focus:border-zinc-900"
				placeholder=" "
				type={isPwd ? "password" : "text"}
				inputMode={isNum ? "numeric" : undefined}
				{...register(valueName, {
					required: isRequired,
				})}
			/>

			<label
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-zinc-500 transition-all
                   peer-focus:top-0 peer-focus:scale-90 peer-focus:text-zinc-900
                   peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:scale-90 peer-[&:not(:placeholder-shown)]:text-zinc-900"
			>
				{placeholderText}
			</label>
		</div>
	)
}
