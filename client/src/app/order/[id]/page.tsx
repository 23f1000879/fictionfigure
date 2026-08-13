"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatPrice, formatDate } from "@/lib/utils";
import { CheckCircle2, Package, Truck, ArrowLeft, Loader2 } from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/products?limit=1")
      .then(() => {
        setOrder({
          id: orderId || "ord-1",
          orderNumber: "FF-1001",
          createdAt: new Date().toISOString(),
          status: "DELIVERED",
          totalAmount: 18500,
          shippingMethod: "Standard Express Shipping",
          trackingNumber: "TRK-98214051",
          shippingAddress: {
            fullName: "Ren Amamiya",
            streetAddress: "42 Shibuya Crossing Apt 4B",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400001",
          },
        });
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-xs text-[#6B6B6B]">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#111111]" /> Loading order details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-[#111111] space-y-8">
      <div className="flex items-center space-x-3 border-b border-[#E5E5E2] pb-6">
        <Link href="/account/orders" className="p-2 border border-[#E5E5E2] hover:border-[#111111]">
          <ArrowLeft className="w-4 h-4 text-[#111111]" />
        </Link>
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] block">
            Order Confirmation Receipt
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-[#111111]">
            Order {order.orderNumber}
          </h1>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E2] p-8 space-y-6 text-xs">
        <div className="flex items-center space-x-3 p-4 bg-[#2E6B44]/10 border border-[#2E6B44] text-[#2E6B44]">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold uppercase tracking-wider">Order Verified & Confirmed</h4>
            <p className="text-[11px]">Your collectible piece has been prepared for dispatch.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#E5E5E2]">
          <div>
            <span className="text-[#6B6B6B] uppercase font-semibold block">Shipping Address</span>
            <p className="font-semibold text-[#111111] mt-1">{order.shippingAddress.fullName}</p>
            <p className="text-[#6B6B6B]">{order.shippingAddress.streetAddress}</p>
            <p className="text-[#6B6B6B]">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
          </div>

          <div>
            <span className="text-[#6B6B6B] uppercase font-semibold block">Fulfillment Status</span>
            <span className="inline-block mt-1 px-3 py-1 bg-[#2E6B44] text-white text-[10px] uppercase font-bold tracking-wider">
              {order.status}
            </span>
            <span className="text-[#6B6B6B] block mt-2">Tracking: {order.trackingNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
