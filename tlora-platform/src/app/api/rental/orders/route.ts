import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { SePayPgClient } from "sepay-pg-node";
import { z } from "zod";
import { RENTAL_ENABLED } from "@/lib/rental/config";
import { canonicalRentalItems, rentalTotals } from "@/lib/rental/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const schema = z.object({ customerName:z.string().trim().min(2).max(100), phone:z.string().trim().regex(/^[0-9+ .()-]{8,20}$/), pickupAt:z.string().datetime(), durationDays:z.number().min(.5).max(5.5), promoCode:z.string().trim().max(30).optional().default(""), items:z.array(z.object({productId:z.string(),size:z.string(),color:z.string(),quantity:z.number().int().min(1).max(5)})).min(1).max(20) });
export async function POST(request:Request){
  try{
    if(!RENTAL_ENABLED)return NextResponse.json({error:"Module đã tắt."},{status:404});
    const input=schema.parse(await request.json());
    const items=canonicalRentalItems(input.items);
    if(!items.some((item)=>item.type==="costume"))return NextResponse.json({error:"Giỏ hàng cần ít nhất một trang phục."},{status:400});
    const totals=rentalTotals(items,input.durationDays,input.promoCode);
    const token=randomUUID().replace(/-/g,"").toUpperCase();
    const orderCode=`TLTD_${token.slice(0,8)}_${token.slice(8,11)}`;
    const admin=createAdminClient();
    const {error}=await admin.from("rental_orders").insert({order_code:orderCode,status:"pending",customer_name:input.customerName,phone:input.phone,pickup_at:input.pickupAt,duration_days:totals.durationDays,items,subtotal_vnd:totals.beforeDiscount,discount_vnd:totals.discount,total_vnd:totals.total,deposit_vnd:totals.deposit,paid_deposit_vnd:0,remaining_vnd:totals.remaining,promo_code:input.promoCode||null,original_costume_count:items.filter((item)=>item.type==="costume").length});
    if(error)throw error;
    if(!process.env.SEPAY_MERCHANT_ID||!process.env.SEPAY_SECRET_KEY)return NextResponse.json({orderCode,checkoutConfigured:false});
    const origin=new URL(request.url).origin;
    const client=new SePayPgClient({env:process.env.SEPAY_ENV==="sandbox"?"sandbox":"production",merchant_id:process.env.SEPAY_MERCHANT_ID,secret_key:process.env.SEPAY_SECRET_KEY});
    const fields=client.checkout.initOneTimePaymentFields({operation:"PURCHASE",payment_method:"BANK_TRANSFER",order_invoice_number:orderCode,order_amount:totals.deposit,currency:"VND",order_description:`Coc thue trang phuc ${orderCode}`,success_url:`${origin}/thue-trang-phuc/thanh-toan/${orderCode}`,error_url:`${origin}/thue-trang-phuc/thanh-toan/${orderCode}?payment=error`,cancel_url:`${origin}/thue-trang-phuc/gio-hang?payment=cancel`,custom_data:JSON.stringify({type:"rental",orderCode})});
    return NextResponse.json({orderCode,checkoutConfigured:true,checkoutUrl:client.checkout.initCheckoutUrl(),fields});
  }catch(error){if(error instanceof z.ZodError)return NextResponse.json({error:"Thông tin đơn thuê chưa hợp lệ.",issues:error.issues},{status:400});return NextResponse.json({error:error instanceof Error?error.message:"Không tạo được đơn thuê."},{status:500});}
}
