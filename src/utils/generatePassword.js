export const generatePassword = () => {
	const capitalLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const smallLetters = "abcdefghijklmnopqrstuvwxyz";
	const numbers = "0123456789";
	const specialCharacters = "!@#$%";

	// Ensure the first character is always an alphabet (either capital or small)
	let password = "";
	const alphabets = capitalLetters + smallLetters;
	password += alphabets[Math.floor(Math.random() * alphabets.length)];

	// Ensure at least one of each required type
	password += numbers[Math.floor(Math.random() * numbers.length)];
	password += specialCharacters[Math.floor(Math.random() * specialCharacters.length)];

	// Fill the rest of the password length with a mix of all types
	const allCharacters = capitalLetters + smallLetters + numbers + specialCharacters;

	for (let i = password.length; i < 8; i++) {
		// Introduce a time-based factor to ensure uniqueness
		const uniqueIndex =
			Math.floor(Math.random() * allCharacters.length) + (Date.now() % allCharacters.length);
		password += allCharacters[uniqueIndex % allCharacters.length];
	}

	// Shuffle the password to ensure randomness
	password = password
		.split("")
		.sort(() => Math.random() - 0.5)
		.join("");

	return password;
};
