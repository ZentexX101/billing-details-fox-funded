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

    if (challengeStage === "phase1") {
        group = "demo\\PH1";
    } else if (challengeStage === "phase2") {
        group = "demo\\PH2";
    } else if (challengeStage === "funded") {
        group = "demo\\REAL";
    }

    // React Hook Form setup
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

            // Prepare order data with user and plan details
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
                // Create the order for the user
                const orderResponse = await apiRequestHandler(
                    "/orders/create-order",
                    "POST",
                    orderData
                );
                // Check if order creation was successful
                if (!orderResponse) {
                    toast.error("Failed to create order.");
                    return;
                }

                // Update the user with the new order ID
                const updateUser = await apiRequestHandler(`/users/${userResponse._id}`, "PUT", {
                    orders: [orderResponse._id],
                });

                // Check if user update with order ID was successful
                if (!updateUser) {
                    toast.error("Failed to update user with new order.");
                    return;
                }

                // Update user purchase products after order is placed
                const updateUserPurchaseProducts = await apiRequestHandler(
                    `/users/${userResponse._id}/purchased-products`,
                    "PUT",
                    {
                        productId: orderResponse.orderId,
                        product: variables?.challengeData,
                    }
                );

                // Check if updating user purchase products was successful
                if (!updateUserPurchaseProducts) {
                    toast.error("Failed to update user purchased products.");
                    return;
                }

                // Create MT5 account

                const sanitizedChallengeName = selectedChallenge.challengeName.replace(
                    /\s*\((Phase-1|Phase-2|Funded)\)/i,
                    ""
                );

                const mt5SignUpData = {
                    EMail: data?.email,
                    master_pass: generatePassword(),
                    investor_pass: generatePassword(),
                    amount: variables?.balance, // TODO: Update with the BALANCE amount
                    FirstName: `Foxx Funded - ${sanitizedChallengeName} (${challengeStage})  ${variables?.first} ${variables?.last}`,
                    LastName: variables?.last,
                    Leverage: 30,
                    Group: group,
                };

                const createUser = await apiRequestHandler(
                    "/users/create-user",
                    "POST",
                    mt5SignUpData
                );

                // Check if MT5 account creation was successful
                if (!createUser?.login) {
                    await apiRequestHandler(`/orders/${orderResponse._id}`, "PUT", {
                        orderStatus: "Processing", // Set to Processing if MT5 account creation fails
                    });
                    toast.error("Failed to create MT5 account.");
                    return;
                }

                if (createUser?.login) {
                    const productId =
                        updateUserPurchaseProducts.data.purchasedProducts[orderResponse.orderId]
                            .productId;

                    const product =
                        updateUserPurchaseProducts.data.purchasedProducts[orderResponse.orderId]
                            .product;

                    // Prepare challenge stage data for injecting MT5 account in user's collection
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

                    // Simulated MT5 account data
                    const mt5Data = {
                        account: createUser.login, // Replace with the new account number,
                        investorPassword: createUser.investor_pass,
                        masterPassword: createUser.master_pass,
                        productId: productId,
                        challengeStage: challengeStage,
                        challengeStageData: challengeStageData,
                        group: mt5SignUpData.Group,
                    };

                    //! Section ends: MT5 account creation through API

                    // Inject MT5 account data in user's collection
                    const updateMT5Account = await apiRequestHandler(
                        `/users/${userResponse._id}`,
                        "PUT",
                        {
                            mt5Accounts: [mt5Data],
                            role: "trader",
                        }
                    );

                    // Check if MT5 account update was successful
                    if (!updateMT5Account) {
                        toast.error("Failed to update user MT5 account.");
                        return;
                    }

                    // Update the order status to Delivered
                    const updateOrderStatus = await apiRequestHandler(
                        `/orders/${orderResponse._id}`,
                        "PUT",
                        {
                            orderStatus: "Delivered",
                            paymentStatus: "Paid",
                        }
                    );

                    // Check if order status update to Delivered was successful
                    if (!updateOrderStatus) {
                        toast.error("Failed to update order status to Delivered.");
                        return;
                    }

                    // Notify user of successful payment processing
                    toast.success("Mt5 Account Assign Successful!");
                }
            } catch (error) {
                // Log the error and notify user
                console.error("🚀 ~ onSuccess error:", error);
                toast.error("An error occurred during the process: " + error.message);
            }
        },
    });

    // await createUser.mutateAsync(infos);

    const onSubmit = async (data) => {
        // Check if a challenge is selected
        if (!selectedChallenge) {
            toast.error("Please select a challenge before submitting.");
            return;
        }

        const accountCreationData = {
            email: data.email,
            first: data.first,
            last: data.last,
            balance: Number(data.balance),
            challengeData: selectedChallenge,
        };

        // Simulate an API call or other async logic
        await createUser.mutateAsync(accountCreationData);

        // Clear form fields and reset selected challenge
        reset(); // Clears all form fields
        setSelectedChallenge(null); // Resets the selected challenge
    };

    return (
        <section className="max-w-[1440px] mx-auto h-screen">
            <div className="flex justify-center items-center h-full flex-col space-y-10">
                <h1 className="text-5xl font-bold">
                    {selectedChallenge?.challengeName || "Select a Challenge"}
                </h1>

                {/* Select Challenge Dropdown */}
                <select
                    className="px-4 py-2 border rounded-md"
                    onChange={(e) => {
                        const selectedKey = e.target.value;
                        setSelectedChallenge(challenges[selectedKey]);
                    }}
                >
                    <option value="">-- Select a Challenge --</option>
                    {Object.keys(challenges).map((key) => (
                        <option key={key} value={key}>
                            {`${challenges[key].challengeName} - ${challenges[key].currentPhase}`}
                        </option>
                    ))}
                </select>

                {/* Form */}
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="w-full flex flex-col items-center space-y-4"
                >
                    {/* Email Field */}
                    <input
                        type="email"
                        placeholder="Email"
                        {...register("email", { required: "Email is required" })}
                        className="px-4 py-2 w-2/4 border rounded-md"
                    />
                    {errors.email && <p className="text-red-500">{errors.email.message}</p>}

                    {/* First Name Field */}
                    <input
                        type="text"
                        placeholder="First Name"
                        {...register("first", { required: "First Name is required" })}
                        className="px-4 py-2 w-2/4 border rounded-md"
                    />
                    {errors.first && <p className="text-red-500">{errors.first.message}</p>}

                    {/* Last Name Field */}
                    <input
                        type="text"
                        placeholder="Last Name"
                        {...register("last", { required: "Last Name is required" })}
                        className="px-4 py-2 w-2/4 border rounded-md"
                    />
                    {errors.last && <p className="text-red-500">{errors.last.message}</p>}

                    {/* Balance Field */}
                    <input
                        type="text"
                        placeholder="Balance"
                        {...register("balance", {
                            required: "Balance is required",
                        })}
                        className="px-4 py-2 w-2/4 border rounded-md"
                    />
                    {errors.balance && <p className="text-red-500">{errors.balance.message}</p>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="px-10 py-2 bg-blue-600 hover:bg-blue-500 duration-500 rounded-md w-2/4 text-white font-bold"
                    >
                        {createUser.isPending ? "Submitting..." : "Submit"}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default BillingDetails;
