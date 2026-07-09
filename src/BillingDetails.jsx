import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { challenges } from "./constants/challengeDatas";
import apiRequestHandler from "./utils/apiRequestHandler";
import { generatePassword } from "./utils/generatePassword";
import { useState } from "react";
import { useForm } from "react-hook-form";

let group;

const BillingDetails = () => {
	const [selectedChallenge, setSelectedChallenge] = useState(null);

	const challengeStage = selectedChallenge?.currentPhase;
	const inputClass =
		"w-full rounded-xl border border-purple-500/30 bg-black/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/30";
	const errorClass = "w-full text-sm font-medium text-red-400";

	if (challengeStage === "phase1") {
		group = "demo\\PH1";
	} else if (challengeStage === "phase2") {
		group = "demo\\PH2";
	} else if (challengeStage === "funded") {
		group = "demo\\REAL";
	}

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm();

	const createUser = useMutation({
		mutationFn: (data) => apiRequestHandler("/users/normal-register", "POST", data),

		onSuccess: async (data, variables) => {
			const userResponse = data;

			if (!userResponse) {
				toast.error("User registration failed.");
				return;
			}

			const orderData = {
				orderItems: [variables.challengeData],
				paymentMethod: "N/A",
				buyerDetails: {
					email: userResponse.email,
					first: userResponse.first,
					last: userResponse.last,
					userId: userResponse._id,
					password: userResponse.password,
				},
				group: group,
				subtotal: variables?.challengeData?.challengePrice,
				discountPrice: variables?.challengeData?.discountPrice || 0,
				totalPrice: variables?.challengeData?.challengePrice,
				referralCode: "",
				isGiveAway: false,
			};

			try {
				const orderResponse = await apiRequestHandler("/orders/create-order", "POST", orderData);

				if (!orderResponse) {
					toast.error("Failed to create order.");
					return;
				}

				const updateUser = await apiRequestHandler(`/users/${userResponse._id}`, "PUT", {
					orders: [orderResponse._id],
				});

				if (!updateUser) {
					toast.error("Failed to update user with new order.");
					return;
				}

				const updateUserPurchaseProducts = await apiRequestHandler(
					`/users/${userResponse._id}/purchased-products`,
					"PUT",
					{
						productId: orderResponse.orderId,
						product: variables?.challengeData,
					},
				);

				if (!updateUserPurchaseProducts) {
					toast.error("Failed to update user purchased products.");
					return;
				}

				const sanitizedChallengeName = selectedChallenge.challengeName.replace(
					/\s*\((Phase-1|Phase-2|Funded)\)/i,
					"",
				);

				const mt5SignUpData = {
					EMail: data?.email,
					master_pass: generatePassword(),
					investor_pass: generatePassword(),
					amount: variables?.balance,
					Account: variables?.account,
					FirstName: `Foxx Funded - ${sanitizedChallengeName} (${challengeStage})  ${variables?.first} ${variables?.last}`,
					LastName: variables?.last,
					Leverage: 30,
					Group: group,
				};

				const createUser = await apiRequestHandler("/users/create-user", "POST", mt5SignUpData);

				if (!createUser?.login) {
					await apiRequestHandler(`/orders/${orderResponse._id}`, "PUT", {
						orderStatus: "Processing",
					});
					toast.error("Failed to create MT5 account.");
					return;
				}

				if (createUser?.login) {
					const productId =
						updateUserPurchaseProducts.data.purchasedProducts[orderResponse.orderId].productId;

					const product =
						updateUserPurchaseProducts.data.purchasedProducts[orderResponse.orderId].product;

					const challengeStageData = {
						...product,
						challengeName: sanitizedChallengeName,
						challengeStages: {
							phase1:
								challengeStage === "phase1"
									? variables?.challengeData?.challengeStages?.phase1
									: null,
							phase2:
								challengeStage === "phase2"
									? variables?.challengeData?.challengeStages?.phase2
									: null,
							funded:
								challengeStage === "phase1" || challengeStage === "phase2"
									? null
									: variables?.challengeData?.challengeStages?.funded,
						},
					};

					const mt5Data = {
						account: createUser.login,
						investorPassword: createUser.investor_pass,
						masterPassword: createUser.master_pass,
						productId: productId,
						challengeStage: challengeStage,
						challengeStageData: challengeStageData,
						group: mt5SignUpData.Group,
					};

					const updateMT5Account = await apiRequestHandler(`/users/${userResponse._id}`, "PUT", {
						mt5Accounts: [mt5Data],
						role: "trader",
					});

					if (!updateMT5Account) {
						toast.error("Failed to update user MT5 account.");
						return;
					}

					const updateOrderStatus = await apiRequestHandler(`/orders/${orderResponse._id}`, "PUT", {
						orderStatus: "Delivered",
						paymentStatus: "Paid",
					});

					if (!updateOrderStatus) {
						toast.error("Failed to update order status to Delivered.");
						return;
					}

					toast.success("Mt5 Account Assign Successful!");
				}
			} catch (error) {
				console.error("onSuccess error:", error);
				toast.error("An error occurred during the process: " + error.message);
			}
		},
	});

	const onSubmit = async (data) => {
		if (!selectedChallenge) {
			toast.error("Please select a challenge before submitting.");
			return;
		}

		const accountCreationData = {
			email: data.email,
			first: data.first,
			last: data.last,
			account: data.account,
			balance: Number(data.balance),
			challengeData: selectedChallenge,
		};

		await createUser.mutateAsync(accountCreationData);

		reset();
		setSelectedChallenge(null);
	};

	return (
		<section className="min-h-screen bg-black px-4 py-10 text-white">
			<div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-[1440px] items-center justify-center">
				<div className="w-full max-w-2xl rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#12001f] via-black to-black p-6 shadow-2xl shadow-purple-950/40 sm:p-8 lg:p-10">
					<div className="mb-8 space-y-3 text-center">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-300">
							Account Setup
						</p>

						<h1 className="text-3xl font-bold text-white sm:text-5xl">
							{selectedChallenge?.challengeName || "Select a Challenge"}
						</h1>

						<p className="text-sm text-gray-400">
							Choose a challenge and enter the trader details below.
						</p>
					</div>

					<select
						className={inputClass}
						value={
							Object.keys(challenges).find((key) => challenges[key] === selectedChallenge) || ""
						}
						onChange={(e) => {
							const selectedKey = e.target.value;
							setSelectedChallenge(selectedKey ? challenges[selectedKey] : null);
						}}>
						<option className="bg-black text-white" value="">
							-- Select a Challenge --
						</option>

						{Object.keys(challenges).map((key) => (
							<option className="bg-black text-white" key={key} value={key}>
								{`${challenges[key].challengeName} - ${challenges[key].currentPhase}`}
							</option>
						))}
					</select>

					<form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
						<div className="space-y-2">
							<input
								type="email"
								placeholder="Email"
								{...register("email", { required: "Email is required" })}
								className={inputClass}
							/>
							{errors.email && <p className={errorClass}>{errors.email.message}</p>}
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<input
									type="text"
									placeholder="First Name"
									{...register("first", { required: "First Name is required" })}
									className={inputClass}
								/>
								{errors.first && <p className={errorClass}>{errors.first.message}</p>}
							</div>

							<div className="space-y-2">
								<input
									type="text"
									placeholder="Last Name"
									{...register("last", { required: "Last Name is required" })}
									className={inputClass}
								/>
								{errors.last && <p className={errorClass}>{errors.last.message}</p>}
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<input
									type="text"
									placeholder="Account"
									{...register("account", {
										required: "Account is required",
									})}
									className={inputClass}
								/>
								{errors.account && <p className={errorClass}>{errors.account.message}</p>}
							</div>

							<div className="space-y-2">
								<input
									type="number"
									placeholder="Balance"
									{...register("balance", {
										required: "Balance is required",
									})}
									className={inputClass}
								/>
								{errors.balance && <p className={errorClass}>{errors.balance.message}</p>}
							</div>
						</div>

						<button
							type="submit"
							disabled={createUser.isPending}
							className="w-full rounded-xl bg-purple-600 px-10 py-3 font-bold text-white shadow-lg shadow-purple-900/30 transition duration-300 hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-purple-900 disabled:text-gray-400">
							{createUser.isPending ? "Submitting..." : "Submit"}
						</button>
					</form>
				</div>
			</div>
		</section>
	);
};

export default BillingDetails;
