/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// To parse this data:
//
//   import { Convert, PayWayPurchaseRequest } from "./payway-purchase-types";
//
//   const purchaseRequest = Convert.toPayWayPurchaseRequest(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface PayWayPurchaseRequest {
  /**
   * Currently, we support WeChat Mini Program. These are the values key `wechat sub_appid`
   * and `wechat_sub_openid`.
   *
   * **PHP Sample Code**
   *
   * ```php
   * $additional_params = base64_encode(json_encode([
   * 'wechat_sub_appid' => 'YOUR WECHAT APP ID',
   * 'wechat_sub_openid' => 'YOUR WECHAT OPEN ID'
   * ]));
   * ```
   */
  additional_params?: string
  /**
   * Purchase amount.
   */
  amount: number
  /**
   * The URL to redirect to after the user closes the payment dialog or when user cancel the
   * payment.
   */
  cancel_url?: string
  /**
   * The URL to redirect to after a successful payment.
   */
  continue_success_url?: string
  /**
   * Transaction currency of the payment. If you don't pass any value, it will take default
   * value from your merchant profile (the first account's the currency of the first account
   * you registered). Supported values are `KHR` or `USD`.
   */
  currency?: string
  /**
   * Additional information that you want to attach to the transaction. This information will
   * appear in the transaction list, transaction details and export report. It's
   * base64-encoded JSON info.
   *
   * **PHP Sample Code**
   *
   * ```php
   * $custom_field = base64_encode(json_encode([
   * "field1" => "myvalue1",
   * "field2" => "myvalue2"
   * ]));
   * ```
   */
  custom_fields?: string
  /**
   * Buyer's email.
   */
  email?: string
  /**
   * Buyer's first name.
   */
  firstname?: string
  /**
   * This field is required if `payment_option` is set to `google_pay` and the payment
   * selection is managed by the merchant. For detailed instructions, please refer to the
   * [Google Pay](/878723m0) integration guidelines.
   */
  google_pay_token?: string
  /**
   * Base64 encode of hash hmac sha512 encryption of concatenates values
   * `req_time`,`merchant_id`,`tran_id`,`amount`,`items`,`shipping`,`firstname`,`lastname`,`email`,`phone`,`type`,`payment_option`,`return_url`,`cancel_url`,`continue_success_url`,`return_deeplink`,`currency`,`custom_fields`,`return_params`,`payout`,`lifetime`,`additional_params`,
   * `google_pay_token` and `skip_success_page` with `public_key`.
   *
   *
   *
   * **PHP Sample Code**
   * ```php
   * // public key provided by ABA Bank
   * $api_key = "API KEY PROVIDED BY ABA BANK";
   *
   * // Prepare the data to be hashed
   * $b4hash = $req_time . $merchant_id . $tran_id . $amount . $items . $shipping . $firstname
   * . $lastname . $email . $phone . $type . $payment_option . $return_url . $cancel_url .
   * $continue_success_url . $return_deeplink . $currency . $custom_fields . $return_params .
   * $payout . $lifetime . $additional_params . $google_pay_token .$skip_success_page;
   *
   *
   * // Generate the HMAC hash using SHA-512 and encode it in Base64
   * $hash = base64_encode(hash_hmac('sha512', $b4hash, $api_key, true));
   * ```
   */
  hash: string
  /**
   * A base64-encoded JSON array describing the items being purchased.
   *
   * **PHP Sample Code**
   *
   * ```php
   * $item = base64_encode(json_encode([
   * ["name" => "product 1","quantity" => 1,"price" => 1.00],
   * ["name" => "product 2","quantity" => 2, "price" => 4.00]
   * ]));
   * ```
   * **Note: This is only description/remark.  The price or quantity in this info will not be
   * used for calculation or any validation purposes**
   */
  items?: string
  /**
   * Buyer's last name.
   */
  lastname?: string
  /**
   * The payment's lifetime in minutes, once it exceeds customer will not allow to make
   * payment.  Default value is 30 days.
   * - Min: 3 mins
   * - Max: 30 days
   *
   * - For ABA PAY or Card: Transaction will not go throught.
   * - KHQR: In case payment happen after exceed life time, PayWay will also reject. Fund will
   * be reverse back to payer.
   * - WeChat & Alipay: No reversal.
   */
  lifetime?: number
  /**
   * A unique merchant key which provided by ABA Bank.
   */
  merchant_id: string
  /**
   * If your merchant profile also supports the **QR Payment API** service, please set this
   * parameter to `0` to use the Checkout service.
   */
  payment_gate?: number
  /**
   * **Payment Methods for Transactions:**
   *
   * - **`cards`**: For card payments.
   * - **`abapay_khqr`**: QR payment that can be scanned and paid using ABA PAY and other KHQR
   * member banks.
   * - **`abapay_khqr_deeplink`**: Allows customers to pay using **ABA PAY** and other **KHQR
   * member banks**. The payment gateway will respond with a JSON object containing
   * `qr_string`, `abapay_deeplink`, and `checkout_qr_url`. See the sample response in the
   * response section below.
   * - **`alipay`**: Allows customers to pay using **Alipay Wallet**.
   * - **`wechat`**: Allows customers to pay using **WeChat Wallet**.
   * - **`google_pay`**: Allows customers to pay using **Google Pay Wallet**.
   *
   * If no value is provided, the payment gateway will automatically display the supported
   * payment options based on your profile, allowing the customer to choose a preferred
   * payment method.
   */
  payment_option?: string
  /**
   * Base64-encoded JSON string representing payout details.
   *
   * **PHP Sample Code**
   * ```php
   * $payout = base64_encode(json_encode([
   * ["acc" => "000133879","amt"=> 1],
   * ["acc" => "000133880","amt" => 1]
   * ]));
   * ```
   */
  payout?: string
  /**
   * Buyer's phone.
   */
  phone?: string
  /**
   * Request date and time in UTC format as YYYYMMDDHHmmss.
   */
  req_time: string
  /**
   * The deep link for redirecting to the app after a successful payment from ABA Mobile. Must
   * be base64-encoded and include both iOS and Android schemes. This field is mandatory for
   * mobile integration.
   *
   * **PHP Sample Code**
   *
   * ```php
   * $return_deeplink =base64_encode(json_encode([
   * "ios_scheme" => "DEEPLINK TO RETURN TO YOUR IOS APP",
   * "android_scheme" => "DEEPLINK TO RETURN TO YOUR ANDROID APP"
   * ]));
   * ```
   */
  return_deeplink?: string
  /**
   * Information to include when PayWay calls your return URL after a successful payment.
   */
  return_params?: string
  /**
   * The URL to which PayWay will send the payment notification upon success.
   */
  return_url?: string
  /**
   * Shipping fee.
   */
  shipping?: number
  /**
   * Skip success page can be configure on checkout service level. We also provide option via
   * the API for you to override the setting too. If you don't pass this param, it will follow
   * the configuration on the profile level. Supported value:
   * - `0` : Don't skip success pages
   * -  `1`: Skip success page.
   *
   * Once you skipe success page, `continue_success_url` on profile level will be used to
   * redirect user to the specific location if you don't pass value of continue_success_url in
   * the request.
   */
  skip_success_page?: number
  /**
   * A unique transaction identifier for the payment.
   */
  tran_id: string
  /**
   * Type of the transaction, default value is `purchase`. Supported value:
   * - `pre-auth` : for pre purchase
   * - `purchase` : for full purchase
   *
   * Note: pre-auth only support ABA PAY, KHQR and Card Payment.
   */
  type?: string
  /**
   * Defines the view type for the payment page.
   * - `hosted_view` : redirect payer to a new tab
   * - `popup` : Display as a **bottom sheet** on mobile web browsers and as a **modal popup**
   * on desktop web browsers.
   */
  view_type?: string
  [property: string]: any
}

export enum PayWayPaymentOption {
  CARDS = "cards",
  ABA_KHQR = "abapay_khqr",
  ABA_KHQR_DEEPLINK = "abapay_khqr_deeplink",
  ALIPAY = "alipay",
  WECHAT = "wechat",
  GOOGLE_PAY = "google_pay",
}

export enum PayWayTransactionType {
  PURCHASE = "purchase",
  PRE_AUTH = "pre-auth",
}

export enum PayWayViewType {
  HOSTED_VIEW = "hosted_view",
  POPUP = "popup",
}

export enum PayWayCurrency {
  USD = "USD",
  KHR = "KHR",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toPayWayPurchaseRequest(json: string): PayWayPurchaseRequest {
    return cast(JSON.parse(json), r("PayWayPurchaseRequest"))
  }

  public static payWayPurchaseRequestToJson(value: PayWayPurchaseRequest): string {
    return JSON.stringify(uncast(value, r("PayWayPurchaseRequest")), null, 2)
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ""): never {
  const prettyTyp = prettyTypeName(typ)
  const parentText = parent ? ` on ${parent}` : ""
  const keyText = key ? ` for key "${key}"` : ""
  throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`)
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`
    } else {
      return `one of [${typ
        .map((a) => {
          return prettyTypeName(a)
        })
        .join(", ")}]`
    }
  } else if (typeof typ === "object" && typ.literal !== undefined) {
    return typ.literal
  } else {
    return typeof typ
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }))
    typ.jsonToJS = map
  }
  return typ.jsonToJS
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {}
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }))
    typ.jsToJSON = map
  }
  return typ.jsToJSON
}

function transform(val: any, typ: any, getProps: any, key: any = "", parent: any = ""): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val
    return invalidValue(typ, val, key, parent)
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length
    for (let i = 0; i < l; i++) {
      const typ = typs[i]
      try {
        return transform(val, typ, getProps)
      } catch (_) {}
    }
    return invalidValue(typs, val, key, parent)
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val
    return invalidValue(
      cases.map((a) => {
        return l(a)
      }),
      val,
      key,
      parent,
    )
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent)
    return val.map((el) => transform(el, typ, getProps))
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null
    }
    const d = new Date(val)
    if (isNaN(d.valueOf())) {
      return invalidValue(l("Date"), val, key, parent)
    }
    return d
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
    if (val === null || typeof val !== "object" || Array.isArray(val)) {
      return invalidValue(l(ref || "object"), val, key, parent)
    }
    const result: any = {}
    Object.getOwnPropertyNames(props).forEach((key) => {
      const prop = props[key]
      const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined
      result[prop.key] = transform(v, prop.typ, getProps, key, ref)
    })
    Object.getOwnPropertyNames(val).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref)
      }
    })
    return result
  }

  if (typ === "any") return val
  if (typ === null) {
    if (val === null) return val
    return invalidValue(typ, val, key, parent)
  }
  if (typ === false) return invalidValue(typ, val, key, parent)
  let ref: any = undefined
  while (typeof typ === "object" && typ.ref !== undefined) {
    ref = typ.ref
    typ = typeMap[typ.ref]
  }
  if (Array.isArray(typ)) return transformEnum(typ, val)
  if (typeof typ === "object") {
    return typ.hasOwnProperty("unionMembers")
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty("arrayItems")
        ? transformArray(typ.arrayItems, val)
        : typ.hasOwnProperty("props")
          ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val, key, parent)
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== "number") return transformDate(val)
  return transformPrimitive(typ, val)
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps)
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps)
}

function l(typ: any) {
  return { literal: typ }
}

function a(typ: any) {
  return { arrayItems: typ }
}

function u(...typs: any[]) {
  return { unionMembers: typs }
}

function o(props: any[], additional: any) {
  return { props, additional }
}

function m(additional: any) {
  return { props: [], additional }
}

function r(name: string) {
  return { ref: name }
}

const typeMap: any = {
  PayWayPurchaseRequest: o(
    [
      { json: "additional_params", js: "additional_params", typ: u(undefined, "") },
      { json: "amount", js: "amount", typ: 3.14 },
      { json: "cancel_url", js: "cancel_url", typ: u(undefined, "") },
      { json: "continue_success_url", js: "continue_success_url", typ: u(undefined, "") },
      { json: "currency", js: "currency", typ: u(undefined, "") },
      { json: "custom_fields", js: "custom_fields", typ: u(undefined, "") },
      { json: "email", js: "email", typ: u(undefined, "") },
      { json: "firstname", js: "firstname", typ: u(undefined, "") },
      { json: "google_pay_token", js: "google_pay_token", typ: u(undefined, "") },
      { json: "hash", js: "hash", typ: "" },
      { json: "items", js: "items", typ: u(undefined, "") },
      { json: "lastname", js: "lastname", typ: u(undefined, "") },
      { json: "lifetime", js: "lifetime", typ: u(undefined, 0) },
      { json: "merchant_id", js: "merchant_id", typ: "" },
      { json: "payment_gate", js: "payment_gate", typ: u(undefined, 0) },
      { json: "payment_option", js: "payment_option", typ: u(undefined, "") },
      { json: "payout", js: "payout", typ: u(undefined, "") },
      { json: "phone", js: "phone", typ: u(undefined, "") },
      { json: "req_time", js: "req_time", typ: "" },
      { json: "return_deeplink", js: "return_deeplink", typ: u(undefined, "") },
      { json: "return_params", js: "return_params", typ: u(undefined, "") },
      { json: "return_url", js: "return_url", typ: u(undefined, "") },
      { json: "shipping", js: "shipping", typ: u(undefined, 3.14) },
      { json: "skip_success_page", js: "skip_success_page", typ: u(undefined, 0) },
      { json: "tran_id", js: "tran_id", typ: "" },
      { json: "type", js: "type", typ: u(undefined, "") },
      { json: "view_type", js: "view_type", typ: u(undefined, "") },
    ],
    "any",
  ),
}
