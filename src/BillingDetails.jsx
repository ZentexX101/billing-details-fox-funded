import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { challenges } from "./constants/challengeDatas";
import apiRequestHandler from "./utils/apiRequestHandler";
import { generatePassword } from "./utils/generatePassword";

let group;

const BillingDetails = () => {
	const [selectedChallenge, setSelectedChallenge] = useState(null);
	const [result, setResult] = useState(null);
	const [submitError, setSubmitError] = useState("");

	const challengeStage = selectedChallenge?.currentPhase;

	const inputClass =
		"w-full rounded-xl border border-white/10 bg-[#101114] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400/70 focus:bg-[#15121a] focus:ring-2 focus:ring-violet-500/20";
	const labelClass = "text-sm font-semibold text-zinc-100";
	const errorClass = "text-sm font-medium text-red-400";

	if (challengeStage === "phase1") {
		group = "ch\\m2\\contest.S\\1";
	} else if (challengeStage === "phase2") {
		group = "ch\\m2\\contest.S\\2";
	} else if (challengeStage === "funded") {
		group = "ch\\m2\\contest.S\\3";
	} else {
		group = "";
	}

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm();

	const handleClear = () => {
		reset();
		setSelectedChallenge(null);
		setResult(null);
		setSubmitError("");
	};

	const createUser = useMutation({
		mutationFn: (data) => apiRequestHandler("/users/normal-register", "POST", data),

		onSuccess: async (data, variables) => {
			const userResponse = data;

			setResult(null);
			setSubmitError("");

			if (!userResponse) {
				setSubmitError("User registration failed.");
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
					setSubmitError("Failed to create order.");
					toast.error("Failed to create order.");
					return;
				}

				const updateUser = await apiRequestHandler(`/users/${userResponse._id}`, "PUT", {
					orders: [orderResponse._id],
				});

				if (!updateUser) {
					setSubmitError("Failed to update user with new order.");
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
					setSubmitError("Failed to update user purchased products.");
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
					FirstName: `NF - ${sanitizedChallengeName} (${challengeStage})  ${variables?.first} ${variables?.last}`,
					LastName: variables?.last,
					Leverage: 30,
					Group: group,
				};

				const createUser = await apiRequestHandler("/users/create-user", "POST", mt5SignUpData);

				if (!createUser?.login) {
					await apiRequestHandler(`/orders/${orderResponse._id}`, "PUT", {
						orderStatus: "Processing",
					});

					setSubmitError("Failed to create MT5 account.");
					toast.error("Failed to create MT5 account.");
					return;
				}

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
					setSubmitError("Failed to update user MT5 account.");
					toast.error("Failed to update user MT5 account.");
					return;
				}

				const updateOrderStatus = await apiRequestHandler(`/orders/${orderResponse._id}`, "PUT", {
					orderStatus: "Delivered",
					paymentStatus: "Paid",
				});

				if (!updateOrderStatus) {
					setSubmitError("Failed to update order status to Delivered.");
					toast.error("Failed to update order status to Delivered.");
					return;
				}

				setResult({
					account: createUser.login,
					masterPassword: createUser.master_pass,
					investorPassword: createUser.investor_pass,
					challenge: sanitizedChallengeName,
					stage: challengeStage,
				});

				toast.success("MT5 Account Assign Successful!");
			} catch (error) {
				console.error("onSuccess error:", error);
				setSubmitError(error.message || "An error occurred during the process.");
				toast.error("An error occurred during the process: " + error.message);
			}
		},
	});

	const onSubmit = async (data) => {
		if (!selectedChallenge) {
			setSubmitError("Please select a challenge before submitting.");
			toast.error("Please select a challenge before submitting.");
			return;
		}

		setResult(null);
		setSubmitError("");

		const accountCreationData = {
			email: data.email,
			first: data.first,
			last: data.last,
			balance: Number(data.balance),
			challengeData: selectedChallenge,
		};

		await createUser.mutateAsync(accountCreationData);
	};

	return (
		<section className="min-h-screen bg-[#08090c] px-4 py-10 text-white">
			<div className="mx-auto max-w-[1180px] rounded-3xl border border-white/10 bg-[#0d0e12] p-6 shadow-2xl shadow-black/50 sm:p-8 lg:p-10">
				<div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.28em] text-violet-300">
							Neura Funding
						</p>
						<h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
							Give Away MT5 Account
						</h1>
						<p className="mt-2 max-w-xl text-sm text-zinc-400">
							Create MT5 giveaway accounts with a clean and fast workflow.
						</p>
					</div>

					<button
						type="button"
						onClick={handleClear}
						className="rounded-xl border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-zinc-100 transition duration-300 hover:border-violet-400/40 hover:bg-violet-500/10">
						Clear
					</button>
				</div>

				<div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
					<div className="space-y-6">
						<div className="rounded-2xl border border-white/10 bg-[#111217] p-6 shadow-xl shadow-black/30">
							<h2 className="text-xl font-bold text-white">User Information</h2>
							<p className="mt-1 text-sm text-zinc-400">
								Enter the basic details for the user account.
							</p>

							<form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<label className={labelClass}>First Name</label>
										<input
											type="text"
											placeholder="Enter first name"
											{...register("first", { required: "First Name is required" })}
											className={inputClass}
										/>
										{errors.first && <p className={errorClass}>{errors.first.message}</p>}
									</div>

									<div className="space-y-2">
										<label className={labelClass}>Last Name</label>
										<input
											type="text"
											placeholder="Enter last name"
											{...register("last", { required: "Last Name is required" })}
											className={inputClass}
										/>
										{errors.last && <p className={errorClass}>{errors.last.message}</p>}
									</div>
								</div>

								<div className="grid gap-4 sm:grid-cols-2">
									<div className="space-y-2">
										<label className={labelClass}>Email</label>
										<input
											type="email"
											placeholder="Enter email"
											{...register("email", { required: "Email is required" })}
											className={inputClass}
										/>
										{errors.email && <p className={errorClass}>{errors.email.message}</p>}
									</div>

									<div className="space-y-2">
										<label className={labelClass}>Balance</label>
										<input
											type="number"
											placeholder="Enter balance"
											{...register("balance", {
												required: "Balance is required",
											})}
											className={inputClass}
										/>
										{errors.balance && <p className={errorClass}>{errors.balance.message}</p>}
									</div>
								</div>

								<div className="rounded-2xl border border-white/10 bg-[#0c0d11] p-5">
									<h2 className="text-xl font-bold text-white">Challenge Setup</h2>
									<p className="mt-1 text-sm text-zinc-400">Choose the challenge.</p>

									<div className="mt-5 space-y-2">
										<label className={labelClass}>Select Challenge</label>
										<select
											className={inputClass}
											value={
												Object.keys(challenges).find(
													(key) => challenges[key] === selectedChallenge,
												) || ""
											}
											onChange={(e) => {
												const selectedKey = e.target.value;
												setSelectedChallenge(selectedKey ? challenges[selectedKey] : null);
											}}>
											<option className="bg-black text-white" value="">
												Select a challenge
											</option>

											{Object.keys(challenges).map((key) => (
												<option className="bg-black text-white" key={key} value={key}>
													{`${challenges[key].challengeName} - ${challenges[key].currentPhase}`}
												</option>
											))}
										</select>
									</div>
								</div>

								<button
									type="submit"
									disabled={createUser.isPending}
									className="w-full rounded-xl bg-violet-600 px-10 py-3 font-bold text-white shadow-lg shadow-violet-950/30 transition duration-300 hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500">
									{createUser.isPending ? "Submitting..." : "Give Away Account"}
								</button>
							</form>
						</div>
					</div>

					<div className="space-y-6">
						<div className="rounded-2xl border border-white/10 bg-[#111217] p-6 shadow-xl shadow-black/30">
							<h2 className="text-xl font-bold text-white">Summary</h2>
							<p className="mt-1 text-sm text-zinc-400">
								Review account creation details before submitting.
							</p>

							<div className="mt-6 space-y-4 text-sm">
								<div className="flex items-center justify-between gap-4">
									<span className="text-zinc-400">Platform</span>
									<span className="font-semibold text-white">MT5</span>
								</div>

								<div className="flex items-center justify-between gap-4">
									<span className="text-zinc-400">Challenge</span>
									<span className="text-right font-semibold text-white">
										{selectedChallenge?.challengeName || "Not selected"}
									</span>
								</div>

								<div className="flex items-center justify-between gap-4">
									<span className="text-zinc-400">Stage</span>
									<span className="font-semibold text-white">
										{challengeStage || "Not selected"}
									</span>
								</div>

								<div className="flex items-center justify-between gap-4">
									<span className="text-zinc-400">Group</span>
									<span className="text-right font-semibold text-white">
										{group || "Not selected"}
									</span>
								</div>
							</div>
						</div>

						{result && (
							<div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6 shadow-xl shadow-black/30">
								<h3 className="text-xl font-bold text-emerald-300">
									Account assigned successfully
								</h3>
								<p className="mt-2 text-sm text-emerald-50/90">
									MT5 account was created and assigned successfully.
								</p>

								<div className="mt-5 rounded-xl border border-white/10 bg-black/35 p-4 text-sm">
									<p className="text-zinc-300">
										Account: <span className="font-bold text-white">{result.account}</span>
									</p>
									<p className="mt-2 text-zinc-300">
										Master Password:{" "}
										<span className="font-bold text-white">{result.masterPassword}</span>
									</p>
									<p className="mt-2 text-zinc-300">
										Investor Password:{" "}
										<span className="font-bold text-white">{result.investorPassword}</span>
									</p>
								</div>
							</div>
						)}

						{submitError && (
							<div className="rounded-2xl border border-red-500/40 bg-black/45 p-6 shadow-xl shadow-red-950/20">
								<h3 className="text-xl font-bold text-red-300">Account creation failed</h3>
								<p className="mt-2 text-sm text-red-100">{submitError}</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
};

export default BillingDetails;
