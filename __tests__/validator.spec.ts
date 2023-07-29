import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", (it) => {
  it.step("works", () => {
    new Schema({
      v: [
        {
          validator(rule, value, callback) {
            callback(new Error("e1"));
          },
        },
        {
          validator(rule, value, callback) {
            callback(new Error("e2"));
          },
        },
      ],
      v2: [
        {
          validator(rule, value, callback) {
            callback(new Error("e3"));
          },
        },
      ],
      v3: [
        {
          validator() {
            return false;
          },
        },
        {
          validator() {
            return new Error("e5");
          },
        },
        {
          validator() {
            return false;
          },
          message: "e6",
        },
        {
          validator() {
            return true;
          },
        },
        // Customize with empty message
        {
          validator() {
            return false;
          },
          message: "",
        },
      ],
    }).validate(
      {
        v: 2,
      },
      (errors) => {
        assertEquals(errors?.length, 7);
        assertEquals(errors?.[0].message, "e1");
        assertEquals(errors?.[1].message, "e2");
        assertEquals(errors?.[2].message, "e3");
        assertEquals(errors?.[3].message, "v3 fails");
        assertEquals(errors?.[4].message, "e5");
        assertEquals(errors?.[5].message, "e6");
        assertEquals(errors?.[6].message, "");
      },
    );
  });

  it.step("first works", () => {
    new Schema({
      v: [
        {
          validator(rule, value, callback) {
            callback(new Error("e1"));
          },
        },
        {
          validator(rule, value, callback) {
            callback(new Error("e2"));
          },
        },
      ],
      v2: [
        {
          validator(rule, value, callback) {
            callback(new Error("e3"));
          },
        },
      ],
    }).validate(
      {
        v: 2,
        v2: 1,
      },
      {
        first: true,
      },
      (errors) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "e1");
      },
    );
  });

  Deno.test("date", (it) => {
    it.step("works for true", () => {
      new Schema({
        v: [
          {
            validator(rule, value, callback) {
              callback(new Error("e1"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e2"));
            },
          },
        ],

        v2: [
          {
            validator(rule, value, callback) {
              callback(new Error("e3"));
            },
          },
        ],
        v3: [
          {
            validator(rule, value, callback) {
              callback(new Error("e4"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e5"));
            },
          },
        ],
      }).validate(
        {
          v: 1,
          v2: 1,
          v3: 1,
        },
        {
          firstFields: true,
        },
        (errors) => {
          assertEquals(errors?.length, 3);
          assertEquals(errors?.[0].message, "e1");
          assertEquals(errors?.[1].message, "e3");
          assertEquals(errors?.[2].message, "e4");
        },
      );
    });

    it.step("works for array", () => {
      new Schema({
        v: [
          {
            validator(rule, value, callback) {
              callback(new Error("e1"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e2"));
            },
          },
        ],

        v2: [
          {
            validator(rule, value, callback) {
              callback(new Error("e3"));
            },
          },
        ],
        v3: [
          {
            validator(rule, value, callback) {
              callback(new Error("e4"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e5"));
            },
          },
        ],
      }).validate(
        {
          v: 1,
          v2: 1,
          v3: 1,
        },
        {
          firstFields: ["v"],
        },
        (errors) => {
          assertEquals(errors?.length, 4);
          assertEquals(errors?.[0].message, "e1");
          assertEquals(errors?.[1].message, "e3");
          assertEquals(errors?.[2].message, "e4");
          assertEquals(errors?.[3].message, "e5");
        },
      );
    });
  });

  Deno.test("date", (it) => {
    it.step("works", () => {
      new Schema({
        v: [
          {
            validator(rule, value, callback) {
              callback(new Error("e1"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e2"));
            },
          },
        ],
        v2: [
          {
            validator(rule, value, callback) {
              callback(new Error("e3"));
            },
          },
        ],
        v3: [
          {
            validator() {
              return false;
            },
          },
          {
            validator() {
              return new Error("e5");
            },
          },
          {
            validator() {
              return false;
            },
            message: "e6",
          },
          {
            validator() {
              return true;
            },
          },
        ],
      })
        .validate({
          v: 2,
        })
        .catch(({ errors, fields }) => {
          assertEquals(errors?.length, 6);
          assertEquals(errors?.[0].message, "e1");
          assertEquals(errors?.[1].message, "e2");
          assertEquals(errors?.[2].message, "e3");
          assertEquals(errors?.[3].message, "v3 fails");
          assertEquals(errors?.[4].message, "e5");
          assertEquals(errors?.[5].message, "e6");
          assertEquals(fields.v[0].fieldValue, 2);
          expect(fields).toMatchInlineSnapshot(`
            Object {
              "v": Array [
                [Error: e1],
                [Error: e2],
              ],
              "v2": Array [
                [Error: e3],
              ],
              "v3": Array [
                Object {
                  "field": "v3",
                  "fieldValue": undefined,
                  "message": "v3 fails",
                },
                Object {
                  "field": "v3",
                  "fieldValue": undefined,
                  "message": "e5",
                },
                Object {
                  "field": "v3",
                  "fieldValue": undefined,
                  "message": "e6",
                },
              ],
            }
          `);
        });
    });

    it.step("first works", () => {
      new Schema({
        v: [
          {
            validator(rule, value, callback) {
              callback(new Error("e1"));
            },
          },
          {
            validator(rule, value, callback) {
              callback(new Error("e2"));
            },
          },
        ],
        v2: [
          {
            validator(rule, value, callback) {
              callback(new Error("e3"));
            },
          },
        ],
      })
        .validate(
          {
            v: 2,
            v2: 1,
          },
          {
            first: true,
          },
        )
        .catch(({ errors }) => {
          assertEquals(errors?.length, 1);
          assertEquals(errors?.[0].message, "e1");
        });
    });

    Deno.test("date", (it) => {
      it.step("works for true", () => {
        new Schema({
          v: [
            {
              validator(rule, value, callback) {
                callback(new Error("e1"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e2"));
              },
            },
          ],

          v2: [
            {
              validator(rule, value, callback) {
                callback(new Error("e3"));
              },
            },
          ],
          v3: [
            {
              validator(rule, value, callback) {
                callback(new Error("e4"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e5"));
              },
            },
          ],
        })
          .validate(
            {
              v: 1,
              v2: 1,
              v3: 1,
            },
            {
              firstFields: true,
            },
          )
          .catch(({ errors }) => {
            assertEquals(errors?.length, 3);
            assertEquals(errors?.[0].message, "e1");
            assertEquals(errors?.[1].message, "e3");
            assertEquals(errors?.[2].message, "e4");
          });
      });

      it.step("works for array", () => {
        new Schema({
          v: [
            {
              validator(rule, value, callback) {
                callback(new Error("e1"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e2"));
              },
            },
          ],

          v2: [
            {
              validator(rule, value, callback) {
                callback(new Error("e3"));
              },
            },
          ],
          v3: [
            {
              validator(rule, value, callback) {
                callback(new Error("e4"));
              },
            },
            {
              validator(rule, value, callback) {
                callback(new Error("e5"));
              },
            },
          ],
        })
          .validate(
            {
              v: 1,
              v2: 1,
              v3: 1,
            },
            {
              firstFields: ["v"],
            },
          )
          .catch(({ errors }) => {
            assertEquals(errors?.length, 4);
            assertEquals(errors?.[0].message, "e1");
            assertEquals(errors?.[1].message, "e3");
            assertEquals(errors?.[2].message, "e4");
            assertEquals(errors?.[3].message, "e5");
          });
      });

      it.step("works for no rules fields", () => {
        new Schema({
          v: [],
          v2: [],
        })
          .validate({
            v: 2,
            v2: 1,
          })
          .then((source) => {
            expect(source).toMatchObject({ v: 2, v2: 1 });
          });
      });
    });
  });

  it.step("custom validate function throw error", () => {
    new Schema({
      v: [
        {
          validator(rule, value, callback) {
            throw new Error("something wrong");
          },
        },
      ],
    })
      .validate(
        { v: "" },
        {
          suppressValidatorError: true,
        },
      )
      .catch(({ errors }) => {
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "something wrong");
      });
  });
});
