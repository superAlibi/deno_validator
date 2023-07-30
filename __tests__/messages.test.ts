import Schema, { ValidateMessages } from "../src/index.ts";
import { assertEquals } from "assert";

Deno.test("date", async (it) => {
  await it.step("can call messages", () => {
    const messages: Partial<ValidateMessages> = {
      required(f: any) {
        return `${f} required!`;
      },
    };
    const schema = new Schema({
      v: {
        required: true,
      },
      v2: {
        type: "array",
      },
    });
    schema.messages(messages);
    schema.validate(
      {
        v: "",
        v2: "1",
      },
      (errors) => {
        assertEquals(errors?.length, 2);
        assertEquals(errors?.[0].message, "v required!");
        assertEquals(errors?.[1].message, "v2 is not an array");
        assertEquals(Object.keys(messages).length, 1);
      },
    );
  });

  await it.step("can use options.messages", () => {
    const messages = {
      required(f: any) {
        return `${f} required!`;
      },
    };
    const schema = new Schema({
      v: {
        required: true,
      },
      v2: {
        type: "array",
      },
    });
    schema.validate(
      {
        v: "",
        v2: "1",
      },
      {
        messages,
      },
      (errors) => {
        assertEquals(errors?.length, 2);
        assertEquals(errors?.[0].message, "v required!");
        assertEquals(errors?.[1].message, "v2 is not an array");
        assertEquals(Object.keys(messages).length, 1);
      },
    );
  });

  await it.step("messages with parameters", () => {
    const messages = {
      required: "Field %s required!",
    };
    const schema = new Schema({
      v: {
        required: true,
      },
    });
    schema.messages(messages);
    schema.validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(!!errors, true);
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "Field v required!");
        assertEquals(Object.keys(messages).length, 1);
      },
    );
  });

  await it.step("messages can be without parameters", () => {
    const messages = {
      required: "required!",
    };
    const schema = new Schema({
      v: {
        required: true,
      },
    });
    schema.messages(messages);
    schema.validate(
      {
        v: "",
      },
      (errors) => {
        assertEquals(!!errors, true);
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, "required!");
        assertEquals(Object.keys(messages).length, 1);
        assertEquals(messages.required, "required!");
      },
    );
  });

  await it.step("message can be a function", () => {
    const message = "this is a function";
    new Schema({
      v: {
        required: true,
        message: () => message,
      },
    }).validate(
      {
        v: "", // provide empty value, this will trigger the message.
      },
      (errors) => {
        assertEquals(!!errors, true);
        assertEquals(errors?.length, 1);
        assertEquals(errors?.[0].message, message);
      },
    );
  });
});
