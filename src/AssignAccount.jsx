/* eslint-disable no-unused-vars */
import { useState } from "react";
import toast from "react-hot-toast";
import { sc10, sc100, sc25, sc50 } from "./constants/challengeDatas";
import apiRequestHandler from "./utils/apiRequestHandler";

function generateRandomHexId() {
	// Generate a random number between 0 and 0xFFFFFF (16777215 in decimal)
	const randomColor = Math.floor(Math.random() * 16777215);

	// Convert the number to a hexadecimal string and pad it with leading zeros if needed
	const hexColor = randomColor.toString(16).padStart(6, "0");

	// Return the hex color string with a '#' prefix
	return `#${hexColor}`;
}

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

const challenge = sc25;

const selectedChallengeName = challenge?.challengeName;

const AssignCredentials = () => {
	const [loading, setLoading] = useState(false);

	// User info array
	// Todo: Update with actual user data, create an array of objects with user info
	const userInfos = [
		{ Email: "syamaizar_81@yahoo.com", Account: 933347 }, // 1
		{ Email: "noraniesasamsi786@gmail.com", Account: 990187 }, // 2
		{ Email: "dkx1piupiu@gmail.com", Account: 930607 }, // 4
		{ Email: "jihaonce@gmail.com", Account: 932072 }, // 5
		{ Email: "jihaonce@gmail.com", Account: 932073 }, // 6
		{ Email: "alhafizsaleh@gmail.com", Account: 932401 }, // 8
		{ Email: "amirfaiz1414@gmail.com", Account: 990068 }, // 9
		{ Email: "ramdanrosli0@gmail.com", Account: 932693 }, // 10
		{ Email: "keluang_man0206@yahoo.com", Account: 931482 }, // 11
		{ Email: "ashvin.catchatrend@gmail.com", Account: 933513 }, // 12
		{ Email: "aznur1808@gmail.com", Account: 931607 }, // 13
		{ Email: "frankenstein_melody@yahoo.com", Account: 932292 }, // 14
		{ Email: "tahufahamhadam@gmail.com", Account: 933800 }, // 15
		{ Email: "joewayderupat@gmail.com", Account: 933168 }, // 16
		{ Email: "unk.trader@gmail.com", Account: 932149 }, // 17
		{ Email: "shaffawi@gmail.com", Account: 931747 }, // 19
		{ Email: "mkrich2020@gmail.com", Account: 931549 }, // 20
		{ Email: "amirsyakir9205@gmail.com", Account: 931663 }, // 21
		{ Email: "roydamia89@gmail.com", Account: 931673 }, // 22
		{ Email: "yuzinc@yahoo.com", Account: 930940 }, // 23
		{ Email: "ritie94@yahoo.com", Account: 931301 }, // 24
		{ Email: "nedya363@gmail.com", Account: 932028 }, // 25
		{ Email: "nedya363@gmail.com", Account: 932029 }, // 26
		{ Email: "radennorfiqri@gmail.com", Account: 931756 }, // 27
		{ Email: "syhirasyraff@gmail.com", Account: 931761 }, // 28
		{ Email: "venancenemo@gmail.com", Account: 931553 }, // 29
		{ Email: "kkernshen@gmail.com", Account: 931225 }, // 30
		{ Email: "newayroad@gmail.com", Account: 931767 }, // 31
		{ Email: "neoamir88@gmail.com", Account: 990529 }, // 32
		{ Email: "azuanabubakar@ymail.com", Account: 990976 }, // 33
		{ Email: "naim.rezeki@gmail.com", Account: 990585 }, // 34
		{ Email: "mohdhizwan90@yahoo.com", Account: 990510 }, // 35
		{ Email: "mohdhizwan90@yahoo.com", Account: 990511 }, // 36
		{ Email: "nevergiveup6236@gmail.com", Account: 990581 }, // 37
		{ Email: "azriafifi@gmail.com", Account: 991131 }, // 38
		{ Email: "azriafifi@gmail.com", Account: 991132 }, // 39
		{ Email: "chaikiancai0424@gmail.com", Account: 990451 }, // 40
		{ Email: "propfly2021@gmail.com", Account: 990522 }, // 41
		{ Email: "rezaaramli93@gmail.com", Account: 990607 }, // 42
		{ Email: "fahmiazlan@live.com", Account: 990895 }, // 43
		{ Email: "arnadhir@gmail.com", Account: 990617 }, // 44
		{ Email: "zamsholkamal@gmail.com", Account: 990531 }, // 45
		{ Email: "weakchicken25@gmail.com", Account: 991764 }, // 46
		{ Email: "mohdhafizmazlan@gmail.com", Account: 991790 }, // 47
		{ Email: "fareezibrahimfx@gmail.com", Account: 991491 }, // 48
		{ Email: "saifulzaidi151@yahoo.com", Account: 991755 }, // 49
		{ Email: "zamsholkamal@gmail.com", Account: 991523 }, // 50
		{ Email: "redzuansauti@gmail.com", Account: 991802 }, // 51
	];
	const handleCreateUser = async () => {
		setLoading(true);
		const failedEmailAttempts = []; // Array to store failed email attempts

		const predefinedPasswords = ["g>_Jx3m8", "g>_Jx3mu", "g>_Jx3mz", "g>_Jx3ms", "g>_Jx3fu"];

		// Helper function to select a predefined password sequentially or randomly
		let passwordIndex = 0;
		const getNextPassword = () => {
			const password = predefinedPasswords[passwordIndex];
			passwordIndex = (passwordIndex + 1) % predefinedPasswords.length; // Cycle through the passwords
			return password;
		};

		try {
			for (const userDetails of userInfos) {
				const orderId = generateRandomHexId();

				// Define user data
				const user = {
					email: userDetails?.Email,
				};

				// Create user
				const createUserResponse = await apiRequestHandler("/users/normal-register", "POST", user);

				if (!createUserResponse) {
					toast.error("Failed to create user");
					setLoading(false);
					return;
				}

				// Update user purchase products after order is placed
				const updateUserPurchaseProducts = await apiRequestHandler(
					`/users/${createUserResponse._id}/purchased-products`,
					"PUT",
					{
						productId: orderId,
						product: challenge, // TODO: Update with actual challenge data
					}
				);

				if (!updateUserPurchaseProducts) {
					toast.error("Failed to update user purchased products.");
					return;
				}

				const productId = updateUserPurchaseProducts.data.purchasedProducts[orderId].productId;
				const product = updateUserPurchaseProducts.data.purchasedProducts[orderId].product;

				// const challengeStage = product?.challengeType === "funded" ? "funded" : "phase1";
				const challengeStage = "phase2"; // TODO: Update with actual challenge stage
				const challengeStageData = {
					...product,
					challengeStages: {
						...product.challengeStages,
						phase1:
							challengeStage === "funded" || challengeStage === "phase2"
								? null
								: product.challengeStages.phase1,
						phase2:
							challengeStage === "funded" || challengeStage === "phase1"
								? null
								: product.challengeStages.phase2,
						funded:
							challengeStage === "phase1" || challengeStage === "phase2"
								? null
								: product.challengeStages.funded,
					},
				};

				const mt5SignUpData = {
					account: userDetails.Account,
					email: createUserResponse.email,
					masterPassword: getNextPassword(), // Use predefined password
					leverage: 30,
					group: "demo\\ecn-demo-2", // TODO: Update with actual MT5 group
					productId,
					challengeStage: challengeStage,
					challengeStageData,
				};

				// Inject MT5 account data in user's collection
				const updateMT5Account = await apiRequestHandler(
					`/users/${createUserResponse._id}`,
					"PUT",
					{
						mt5Accounts: [mt5SignUpData],
					}
				);

				// Changing password for MT5 account
				const changeMT5Pass = await apiRequestHandler(
					`/users/change-password/${mt5SignUpData.account}`,
					"PUT",
					{
						masterPassword: mt5SignUpData.masterPassword,
					}
				);

				if (changeMT5Pass !== "OK") {
					if (!updateMT5Account) {
						toast.error("Failed to update user MT5 account.");
						return;
					}

					toast.success(
						`MT5 account created successfully for user ${createUserResponse.email}. Account: ${mt5SignUpData.account}`
					);

					// Update the user's role to trader
					await apiRequestHandler(`/users/${createUserResponse._id}`, "PUT", {
						role: "trader",
					});

					const emailObjects = {
						email: userDetails.Email,
						account: userDetails.Account,
						masterPassword: mt5SignUpData.masterPassword,
						password: updateMT5Account.password,
					};
					try {
						const sendEmail = await apiRequestHandler(
							"/users/credentials",
							"POST",
							emailObjects,
							null
						);
						if (!sendEmail) {
							throw new Error("Failed to send email");
						}

						console.log("🚀 ~ handleCreateUser ~ sendEmail:", sendEmail);
						toast.success(
							`MT5 account created and email sent successfully for account: ${mt5SignUpData.account}`
						);
					} catch (emailError) {
						toast.error("Failed to send email. Data has been saved for review.");
						// Save failed email details for later review
						failedEmailAttempts.push(emailObjects);
					}
				}
			}
		} catch (error) {
			toast.error("An unexpected error occurred.");
		} finally {
			setLoading(false);
			if (failedEmailAttempts.length > 0) {
				console.log("Failed email attempts:", failedEmailAttempts);
				// Optionally, you can store it in a state for UI display
			}
		}
	};

	return (
		<section className="max-w-[1440px] mx-auto h-screen">
			<div className="flex justify-center items-center h-full flex-col">
				<h1 className="text-5xl font-bold">Challenge Selected : {selectedChallengeName || ""}</h1>
				<button
					onClick={handleCreateUser}
					type="button"
					className="bg-blue-600 px-6 py-4 text-white rounded-md my-10"
					disabled={loading}>
					{loading ? "Processing..." : "Create MT5 in Database"}
				</button>
			</div>
		</section>
	);
};

export default AssignCredentials;
