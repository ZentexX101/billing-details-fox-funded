import { useEffect, useState } from "react";
import apiRequestHandler from "./utils/apiRequestHandler";

const accounts = [
	{ login_number: 989760 },
	{ login_number: 989765 },
	{ login_number: 989812 },
	{ login_number: 989854 },
	{ login_number: 989836 },
	{ login_number: 990020 },
	{ login_number: 990021 },
	{ login_number: 990026 },
	{ login_number: 989636 },
	{ login_number: 990005 },
	{ login_number: 989680 },
	{ login_number: 989778 },
	{ login_number: 989863 },
	{ login_number: 989756 },
	{ login_number: 989914 },
	{ login_number: 989917 },
	{ login_number: 989853 },
	{ login_number: 989865 },
	{ login_number: 989720 },
	{ login_number: 989886 },
	{ login_number: 989607 },
	{ login_number: 989604 },
	{ login_number: 989839 },
	{ login_number: 990095 },
	{ login_number: 989693 },
	{ login_number: 989635 },
	{ login_number: 989993 },
	{ login_number: 989815 },
	{ login_number: 990014 },
	{ login_number: 989679 },
	{ login_number: 989681 },
	{ login_number: 989682 },
	{ login_number: 989684 },
	{ login_number: 989602 },
	{ login_number: 989702 },
	{ login_number: 989648 },
	{ login_number: 989752 },
	{ login_number: 990018 },
	{ login_number: 990040 },
	{ login_number: 989761 },
	{ login_number: 989717 },
	{ login_number: 989697 },
	{ login_number: 989992 },
	{ login_number: 989582 },
	{ login_number: 989833 },
	{ login_number: 989642 },
	{ login_number: 989643 },
	{ login_number: 989644 },
	{ login_number: 989645 },
	{ login_number: 989646 },
	{ login_number: 989656 },
	{ login_number: 989662 },
	{ login_number: 990025 },
	{ login_number: 990027 },
	{ login_number: 990042 },
	{ login_number: 990035 },
	{ login_number: 989767 },
];

const NoEmail = () => {
	const [data, setData] = useState([]);
	const [errorAccounts, setErrorAccounts] = useState([]);

	const generatePassword = () => {
		const capitalLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const smallLetters = "abcdefghijklmnopqrstuvwxyz";
		const numbers = "0123456789";
		const specialCharacters = "!@#$%^&*()_+[]{}|;:,.<>?";

		// Ensure at least one of each required type
		let password = "";
		password += capitalLetters[Math.floor(Math.random() * capitalLetters.length)];
		password += smallLetters[Math.floor(Math.random() * smallLetters.length)];
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

	console.log(generatePassword());

	// Function to generate the available account and email data and download it as 5KSc.txt
	const generateTxtFile = () => {
		// Create the content for the .txt file
		let fileContent = "Account Number, Email\n";
		data.forEach((item) => {
			const account = item?.Mt5Accounts?.Account || "N/A";
			const email = item?.email || "N/A";
			fileContent += `${account}, ${email}\n`;
		});

		// Create a Blob from the text content
		const blob = new Blob([fileContent], { type: "text/plain" });

		// Create a download link and trigger it
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = "5KScAvailable.txt"; // Set the file name to 5KSc.txt
		link.click(); // Trigger the download
	};

	// Function to generate and download the error accounts as 5KScNotAvailable.txt
	const generateErrorTxtFile = () => {
		// Create the content for the error accounts .txt file
		let fileContent = "Account Numbers with No Data\n";
		errorAccounts.forEach((accountNumber) => {
			fileContent += `${accountNumber}\n`;
		});

		// Create a Blob from the text content
		const blob = new Blob([fileContent], { type: "text/plain" });

		// Create a download link and trigger it
		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = "5KScNotAvailablePhase1.txt"; // Set the file name to 5KScNotAvailable.txt
		link.click(); // Trigger the download
	};

	useEffect(() => {
		const fetchData = async () => {
			try {
				const results = await Promise.all(
					accounts.map(async (acc) => {
						try {
							// Fetch data for each account
							const result = await apiRequestHandler(
								`/users/mt5-accounts/${acc.login_number}`,
								"GET",
								null
							);
							return { success: true, data: result };
						} catch (error) {
							setErrorAccounts((prev) => [...prev, acc.login_number]);
							return { success: false, data: null };
						}
					})
				);
				const successfulResults = results.filter((res) => res.success).map((res) => res.data);
				setData(successfulResults);
			} catch (error) {
				console.error("Error fetching accounts:", error);
			}
		};

		fetchData();
	}, []);

	return (
		<div>
			<h1>This is NoEmail component</h1>

			{/* Button to generate and download the available accounts' txt file */}
			<div className="flex justify-center">
				<button
					type="button"
					className="px-4 py-2 bg-blue-600 rounded-lg text-white flex justify-center mb-10"
					onClick={generateTxtFile}>
					Download Account & Email Info
				</button>
			</div>

			{/* Button to generate and download the error accounts' txt file */}
			<div className="flex justify-center">
				<button
					type="button"
					className="px-4 py-2 bg-red-600 rounded-lg text-white flex justify-center "
					onClick={generateErrorTxtFile}>
					Download Accounts with No Data
				</button>
			</div>

			{/* Display available data in a table */}
			{data.length > 0 ? (
				<div>
					<h2>Available MT5 Account Data</h2>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr>
								<th style={{ border: "1px solid black", padding: "8px" }}>Email</th>
								<th style={{ border: "1px solid black", padding: "8px" }}>Account Number</th>
							</tr>
						</thead>
						<tbody>
							{data.map((item, index) => (
								<tr key={index}>
									<td style={{ border: "1px solid black", padding: "8px" }}>
										{item.email || "N/A"}
									</td>
									<td style={{ border: "1px solid black", padding: "8px" }}>
										{item.Mt5Accounts?.Account || "N/A"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<p>No data available</p>
			)}

			{/* Display error accounts */}
			{errorAccounts.length > 0 && (
				<div>
					<h2>Accounts with No Data</h2>
					<ul>
						{errorAccounts.map((acc, index) => (
							<li key={index}>Account {acc} has no available data.</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default NoEmail;
