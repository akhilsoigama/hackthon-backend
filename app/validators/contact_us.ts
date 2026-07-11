import vine from "@vinejs/vine";

export const contactValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(2),

    lastName: vine.string().trim().minLength(2),

    email: vine.string().email(),

    message: vine.string().trim().minLength(10),
  })
);