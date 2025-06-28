/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { approvePayPalOrder, createPayPalOrder } from "@/lib/actions/order.actions"
import type { IOrder } from "@/lib/db/models/order.model"
import { formatDateTime } from "@/lib/utils"

import CheckoutFooter from "../checkout-footer"
import { redirect, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import ProductPrice from "@/components/shared/product/product-price"
import StripeForm from "./stripe-form"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import PayWayCheckout from "@/components/payway/payway-checkout"
import PaymentLinkOption from "./payment-link-option"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)
export default function OrderDetailsForm({
  order,
  paypalClientId,
  clientSecret,
}: {
  order: IOrder
  paypalClientId: string
  isAdmin: boolean
  clientSecret: string | null
}) {
  const router = useRouter()
  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    expectedDeliveryDate,
    isPaid,
  } = order
  const { toast } = useToast()

  if (isPaid) {
    redirect(`/account/orders/${order._id}`)
  }
  function PrintLoadingState() {
    const [{ isPending, isRejected }] = usePayPalScriptReducer()
    let status = ""
    if (isPending) {
      status = "Loading PayPal..."
    } else if (isRejected) {
      status = "Error in loading PayPal."
    }
    return status
  }
  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(order._id)
    if (!res.success)
      return toast({
        description: res.message,
        variant: "destructive",
      })
    return res.data
  }
  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    const res = await approvePayPalOrder(order._id, data)
    toast({
      description: res.message,
      variant: res.success ? "default" : "destructive",
    })
  }

  const CheckoutSummary = () => (
    <Card>
      <CardContent className="w-full">
        <div>
          <div className="text-lg font-bold">Order Summary</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items:</span>
              <span>
                {" "}
                <ProductPrice price={itemsPrice} plain />
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping & Handling:</span>
              <span>
                {shippingPrice === undefined ? (
                  "--"
                ) : shippingPrice === 0 ? (
                  "FREE"
                ) : (
                  <ProductPrice price={shippingPrice} plain />
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span> Tax:</span>
              <span>{taxPrice === undefined ? "--" : <ProductPrice price={taxPrice} plain />}</span>
            </div>
            <div className="flex justify-between  pt-1 font-bold text-lg">
              <span> Order Total:</span>
              <span>
                {" "}
                <ProductPrice price={totalPrice} plain />
              </span>
            </div>

            {!isPaid && paymentMethod === "PayWay Payment Link" && (
  <div className="pt-4">
    <PaymentLinkOption
      orderId={order._id}
      amount={totalPrice}
      customerInfo={{
        name: shippingAddress.fullName,
        email: (order.user as any).email || "customer@example.com",
        phone: shippingAddress.phone,
      }}
      onSuccess={() => {
        toast({
          title: "Payment Link Created",
          description: "Share the payment link with your customer",
        })
      }}
      onError={(error: string) => {
        toast({
          title: "Failed to Create Payment Link",
          description: error,
          variant: "destructive",
        })
      }}
    />
  </div>
)}
            

            {!isPaid && paymentMethod === "PayPal" && (
              <div>
                <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                  <PrintLoadingState />
                  <PayPalButtons createOrder={handleCreatePayPalOrder} onApprove={handleApprovePayPalOrder} />
                </PayPalScriptProvider>
              </div>
            )}
            {!isPaid && paymentMethod === "Stripe" && clientSecret && (
              <Elements
                options={{
                  clientSecret,
                }}
                stripe={stripePromise}
              >
                <StripeForm priceInCents={Math.round(order.totalPrice * 100)} orderId={order._id} />
              </Elements>
            )}
            {!isPaid && paymentMethod === "PayWay" && (
              <div className="pt-4">
                <PayWayCheckout
                  orderId={order._id}
                  amount={totalPrice}
                  customerInfo={{
                    name: shippingAddress.fullName,

                    email: (order.user as any).email || "customer@example.com",
                    phone: shippingAddress.phone,
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  onSuccess={(transactionRef: string) => {
                    toast({
                      title: "Payment Successful",
                      description: "Your order has been paid successfully!",
                    })
                    router.push(`/account/orders/${order._id}`)
                  }}
                  onError={(error: string) => {
                    toast({
                      title: "Payment Failed",
                      description: error,
                      variant: "destructive",
                    })
                  }}
                  onCancel={() => {
                    toast({
                      title: "Payment Cancelled",
                      description: "You can try again when ready.",
                    })
                  }}
                />
              </div>
            )}

            {!isPaid && paymentMethod === "Cash On Delivery" && (
              <Button className="w-full rounded-full" onClick={() => router.push(`/account/orders/${order._id}`)}>
                View Order
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <main className="max-w-6xl mx-auto px-4">
  <div className="grid md:grid-cols-12 gap-6">
    {/* Left content area */}
    <div className="md:col-span-8">
      {/* Shipping Address */}
      <div className="grid md:grid-cols-3 my-3 pb-3">
        <div className="text-lg font-bold">
          <span>Shipping Address</span>
        </div>
        <div className="md:col-span-2">
          <p>
            {shippingAddress.fullName} <br />
            {shippingAddress.street} <br />
            {`${shippingAddress.city}, ${shippingAddress.province}, ${shippingAddress.postalCode}, ${shippingAddress.country}`}
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="border-y">
        <div className="grid md:grid-cols-3 my-3 pb-3">
          <div className="text-lg font-bold">
            <span>Payment Method</span>
          </div>
          <div className="md:col-span-2">
            <p>{paymentMethod}</p>
          </div>
        </div>
      </div>

      {/* Items and Shipping */}
      <div className="grid md:grid-cols-3 my-3 pb-3">
        <div className="text-lg font-bold">
          <span>Items and shipping</span>
        </div>
        <div className="md:col-span-2">
          <p>
            Delivery date: {formatDateTime(expectedDeliveryDate).dateOnly}
          </p>
          <ul>
            {items.map((item) => (
              <li key={item.slug}>
                {item.name} x {item.quantity} = {item.price}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Summary for mobile */}
      <div className="block md:hidden">
        <CheckoutSummary />
      </div>

      <CheckoutFooter />
    </div>

    {/* Order Summary on Desktop */}
    <div className="hidden md:block md:col-span-4">
      <CheckoutSummary />
    </div>
  </div>
</main>

  )
}
