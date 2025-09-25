/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// To parse this data:
//
//   import { Convert, Model, PayWaySuccessResponse, PayWayCallbackResponse, PayWayStatus } from "./file";
//
//   const model = Convert.toModel(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Model {
  "01JME5PQCH7BA4JH9V9C51N1FV": any
  [property: string]: any
}

export interface PayWaySuccessResponse {
  "01JME5PQCH7BA4JH9V9C51N1FV": any
  [property: string]: any
}

export interface PayWayCallbackResponse {
  tran_id: string
  status: string
  hash?: string
  custom_fields?: string
  amount?: number
  currency?: string
  payment_method?: string
  timestamp?: string
  signature?: string
}

export enum PayWayStatus {
  SUCCESS = "success",
  COMPLETED = "completed",
  PAID = "paid",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PENDING = "pending",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toModel(json: string): Model {
    return cast(JSON.parse(json), r("Model"))
  }

  public static modelToJson(value: Model): string {
    return JSON.stringify(uncast(value, r("Model")), null, 2)
  }

  public static toPayWaySuccessResponse(json: string): PayWaySuccessResponse {
    return cast(JSON.parse(json), r("PayWaySuccessResponse"))
  }

  public static payWaySuccessResponseToJson(value: PayWaySuccessResponse): string {
    return JSON.stringify(uncast(value, r("PayWaySuccessResponse")), null, 2)
  }

  public static toPayWayCallbackResponse(json: string): PayWayCallbackResponse {
    return cast(JSON.parse(json), r("PayWayCallbackResponse"))
  }

  public static payWayCallbackResponseToJson(value: PayWayCallbackResponse): string {
    return JSON.stringify(uncast(value, r("PayWayCallbackResponse")), null, 2)
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
  Model: o([{ json: "01JME5PQCH7BA4JH9V9C51N1FV", js: "01JME5PQCH7BA4JH9V9C51N1FV", typ: "any" }], "any"),
  PayWaySuccessResponse: o(
    [{ json: "01JME5PQCH7BA4JH9V9C51N1FV", js: "01JME5PQCH7BA4JH9V9C51N1FV", typ: "any" }],
    "any",
  ),
  PayWayCallbackResponse: o(
    [
      { json: "tran_id", js: "tran_id", typ: "string" },
      { json: "status", js: "status", typ: "string" },
      { json: "hash", js: "hash", typ: u(undefined, "string") },
      { json: "custom_fields", js: "custom_fields", typ: u(undefined, "string") },
      { json: "amount", js: "amount", typ: u(undefined, 0) },
      { json: "currency", js: "currency", typ: u(undefined, "string") },
      { json: "payment_method", js: "payment_method", typ: u(undefined, "string") },
      { json: "timestamp", js: "timestamp", typ: u(undefined, "string") },
      { json: "signature", js: "signature", typ: u(undefined, "string") },
    ],
    "any",
  ),
}
