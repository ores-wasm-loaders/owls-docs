# MASH pages and the loading layer

Our Rust web servers render maud/axum/htmx pages: server-rendered HTML with HTMX
interactions. **That is not a browser-Wasm stack**, and it needs no Wasm loader.

What that means in practice:

* A MASH page that has no Wasm island loads no loader at all. Adding one would put a script
  in front of a page whose whole advantage is not having one.
* A MASH page *with* islands loads the coordinator plus the Rust adapter, and prepares the
  island bundle when an island is about to enter the viewport.
* Server and ORM code is never shipped to the browser to make the loading model look uniform
  across products. Uniformity is a property of the loading layer, not of the page.

The decision, per page, is simply: does this page instantiate WebAssembly? If not, it is done.
