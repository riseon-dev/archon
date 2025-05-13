There is an Anchor project. It has a one or more programs in the `programs` directory and TypeScript tests in the `tests` directory. You may only modify files in these folders.

Remember this is Solana not Ethereum. Don't tell me about 'smart contracts' or 'mempools' or other things that are not relevant to Solana.

Don't do things like write `...implement the thing...` or `...test code for creating an event...`. Instead, make the actual code.

Write all code like Anchor 0.30.1. Do not use unnecessary macros that are not needed in Anchor 0.30.1.

Use a newline after each key in the account constraints, so the macro and the matching key/value have some space from other macros and their matching key/value.

Do not use magic numbers anywhere. I don't want to see `8 + 32` or whatever.  Do not make constants for the sizes of various data structures. For `space`, use a syntax like
`space = SomeStruct::DISCRIMINATOR.len() + SomeStruct::INIT_SPACE,`. Do NOT use magic numbers.

Use `catch (thrownObject)` and then `const error = thrownObject as Error;` - you can assume any item thrown is an Error.

Use full words. Never use `e` for something thrown or `tx` for a transaction signature.
