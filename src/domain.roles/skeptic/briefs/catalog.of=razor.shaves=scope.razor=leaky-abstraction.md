# razor: leaky abstraction

shaves: a claim at the wrong level (a model stated as the world) · settled by: observation (read below the layer: the log, the source, the failure)

## .the question

> **what does this layer hide, and could the hidden part break the claim made from above it?**

a claim made from the top of a stack ("the api returns x, so x") asserts that the abstraction is sealed. `razor=chesterton` asks why a fence stands; this asks what sits under the cover.

## .the source

- Joel Spolsky, "The Law of Leaky Abstractions", 11 Nov 2002: "All non-trivial abstractions, to some degree, are leaky."
- read at https://www.joelonsoftware.com/2002/11/11/the-law-of-leaky-abstractions/
- a software law; its use for claims outside code is this role's gloss

## .fails when

- the law gives no count of leaks; most layers hold. a look under every layer costs more than it buys: size the look to the harm of an error

## .run by

`rule.always.skepticize-the-layer-of-a-cure`
