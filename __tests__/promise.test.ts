import Schema from "../src/index.ts";
import { assertEquals } from "assert";
Deno.test("date", async (it) => {
  await it.step("works", () => {
    new Schema({
      v: [
        {
          asyncValidator(rule, value) {
            return Promise.reject(new Error("e1"));
          },
        },
        {
          asyncValidator(rule, value) {
            return Promise.reject(new Error("e2"));
          },
        },
      ],
      v2: [
        {
          asyncValidator(rule, value) {
            return Promise.reject(new Error("e3"));
          },
        },
      ],
    }).validate(
      {
        v: 2,
      },
      (errors) => {
        assertEquals(errors?.length, 3);
        assertEquals(errors?.[0].message, "e1");
        assertEquals(errors?.[1].message, "e2");
        assertEquals(errors?.[2].message, "e3");
      },
    );
  });

  await it.step("first works", () => {
    new Schema({
      v: [
        {
          asyncValidator(rule, value) {
            return Promise.reject(new Error("e1"));
          },
        },
        {
          asyncValidator(rule, value) {
            return Promise.reject(new Error("e2"));
          },
        },
      ],
      v2: [
        {
          asyncValidator(rule, value) {
            return Promise.reject(new Error("e3"));
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

  Deno.test("date", async (it) => {
    await it.step("works for true", () => {
      new Schema({
        v: [
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e1"));
            },
          },
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e2"));
            },
          },
        ],

        v2: [
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e3"));
            },
          },
        ],
        v3: [
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e4"));
            },
          },
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e5"));
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

    await it.step("works for array", () => {
      new Schema({
        v: [
          {
            asyncValidator: (rule, value) => {
              return Promise.reject(new Error("e1"));
            },
          },
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e2"));
            },
          },
        ],

        v2: [
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e3"));
            },
          },
        ],
        v3: [
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e4"));
            },
          },
          {
            asyncValidator(rule, value) {
              return Promise.reject(new Error("e5"));
            },
          },
        ],
        v4: [
          {
            asyncValidator: () =>
              new Promise((resolve, reject) => {
                setTimeout(resolve, 100);
              }),
          },
          {
            asyncValidator: () =>
              new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error("e6")), 100);
              }),
          },
          {
            asyncValidator: () =>
              new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error("")), 100);
              }),
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
          assertEquals(errors?.length, 6);
          assertEquals(errors?.[0].message, "e1");
          assertEquals(errors?.[1].message, "e3");
          assertEquals(errors?.[2].message, "e4");
          assertEquals(errors?.[3].message, "e5");
          assertEquals(errors?.[4].message, "e6");
          assertEquals(errors?.[5].message, "");
        },
      );
    });
    await it.step("Whether to remove the 'Uncaught (in promise)' warning", () => {
      let allCorrect = true;
      try {
        new Schema({
          async: {
            asyncValidator(rule, value) {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject([
                    new Error(
                      typeof rule.message === "function"
                        ? rule.message()
                        : rule.message,
                    ),
                  ]);
                }, 100);
              });
            },
            message: "async fails",
          },
        }).validate({
          v: 1,
        });
      } catch ({ errors }) {
        allCorrect = errors?.length === 1;
      }
      assertEquals(allCorrect, true);
    });
  });
});
