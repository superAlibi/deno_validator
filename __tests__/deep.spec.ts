import Schema, { Rules } from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", (it) => {
  it.step("deep array specific validation", () => {
    new Schema({
      v: {
        required: true,
        type: "array",
        fields: {
          "0": [{ type: "string" }],
          "1": [{ type: "string" }],
        },
      },
    }).validate(
      {
        v: [1, "b"],
      },
      (errors, fields) => {
        assertEquals(errors?.length, 1);
        expect(fields).toMatchInlineSnapshot(`
          Object {
            "v.0": Array [
              Object {
                "field": "v.0",
                "fieldValue": 1,
                "message": "v.0 is not a string",
              },
            ],
          }
        `);
        assertEquals(errors?.[0].message, "v.0 is not a string");
      },
    );
  });

  it.step("deep object specific validation", () => {
    new Schema({
      v: {
        required: true,
        type: "object",
        fields: {
          a: [{ type: "string" }],
          b: [{ type: "string" }],
        },
      },
    }).validate(
      {
        v: {
          a: 1,
          b: "c",
        },
      },
      (errors, fields) => {
        assertEquals(errors?.length, 1);
        expect(fields).toMatchInlineSnapshot(`
          Object {
            "v.a": Array [
              Object {
                "field": "v.a",
                "fieldValue": 1,
                "message": "v.a is not a string",
              },
            ],
          }
        `);
        assertEquals(errors?.[0].message, "v.a is not a string");
      },
    );
  });

  Deno.test("date", (it) => {
    it.step("deep array all values validation", () => {
      new Schema({
        v: {
          required: true,
          type: "array",
          defaultField: [{ type: "string" }],
        },
      }).validate(
        {
          v: [1, 2, "c"],
        },
        (errors, fields) => {
          assertEquals(errors?.length, 2);
          expect(fields).toMatchInlineSnapshot(`
            Object {
              "v.0": Array [
                Object {
                  "field": "v.0",
                  "fieldValue": 1,
                  "message": "v.0 is not a string",
                },
              ],
              "v.1": Array [
                Object {
                  "field": "v.1",
                  "fieldValue": 2,
                  "message": "v.1 is not a string",
                },
              ],
            }
          `);
          assertEquals(errors?.[0].message, "v.0 is not a string");
          assertEquals(errors?.[1].message, "v.1 is not a string");
        },
      );
    });

    it.step("deep transform array all values validation", () => {
      new Schema({
        v: {
          required: true,
          type: "array",
          defaultField: [{ type: "number", max: 0, transform: Number }],
        },
      }).validate(
        {
          v: ["1", "2"],
        },
        (errors, fields) => {
          assertEquals(errors?.length, 2);
          expect(fields).toMatchInlineSnapshot(`
            Object {
              "v.0": Array [
                Object {
                  "field": "v.0",
                  "fieldValue": 1,
                  "message": "v.0 cannot be greater than 0",
                },
              ],
              "v.1": Array [
                Object {
                  "field": "v.1",
                  "fieldValue": 2,
                  "message": "v.1 cannot be greater than 0",
                },
              ],
            }
          `);
          expect(errors).toMatchInlineSnapshot(`
            Array [
              Object {
                "field": "v.0",
                "fieldValue": 1,
                "message": "v.0 cannot be greater than 0",
              },
              Object {
                "field": "v.1",
                "fieldValue": 2,
                "message": "v.1 cannot be greater than 0",
              },
            ]
          `);
        },
      );
    });

    it("will merge top validation", () => {
      const obj = {
        value: "",
        test: [
          {
            name: "aa",
          },
        ],
      };

      const descriptor: Rules = {
        test: {
          type: "array",
          min: 2,
          required: true,
          message: "至少两项",
          defaultField: [
            {
              type: "object",
              required: true,
              message: "test 必须有",
              fields: {
                name: {
                  type: "string",
                  required: true,
                  message: "name 必须有",
                },
              },
            },
          ],
        },
      };

      new Schema(descriptor).validate(obj, (errors) => {
        expect(errors).toMatchInlineSnapshot(`
          Array [
            Object {
              "field": "test",
              "fieldValue": Array [
                Object {
                  "name": "aa",
                },
              ],
              "message": "至少两项",
            },
          ]
        `);
      });
    });

    it.step("array & required works", () => {
      const descriptor: Rules = {
        testArray: {
          type: "array",
          required: true,
          defaultField: [{ type: "string" }],
        },
      };
      const record = {
        testArray: [],
      };
      const validator = new Schema(descriptor);
      validator.validate(record, (errors, fields) => {
      });
    });

    it.step("deep object all values validation", () => {
      new Schema({
        v: {
          required: true,
          type: "object",
          defaultField: [{ type: "string" }],
        },
      }).validate(
        {
          v: {
            a: 1,
            b: "c",
          },
        },
        (errors) => {
          assertEquals(errors?.length, 1);
          assertEquals(errors?.[0].message, "v.a is not a string");
        },
      );
    });
  });
});
