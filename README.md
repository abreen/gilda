# `gilda`

A miniature implementation of R\*\*\*\*.

## The `<gilda-root>` element

In the `type` attribute, a Component name must be specified. A Component is any function that returns an Element (or text).

## `el()`

Create an Element, a simple representation of UI that doesn't involve the DOM. An Element can refer directly to an HTML element like `<p>`, or recursively to a Component (which eventually returns HTML).

### `fragment()`

A way to return more than one Element at once without introducing a new parent Element.

## `render()`

Convert Elements into actual DOM nodes. This involves repeatedly calling Components to obtain the Elements they return, converting them to DOM nodes, and setting up the parent/child relationships.

## Examples

<figure>
  <figcaption>
    A recursive component that repeats and fades text
  </figcaption>

  <gilda-root type="HelloGilda"></gilda-root>

  <pre data-component-output="HelloGilda"></pre>

  <details>
    <summary>See source code</summary>
    <pre data-component-source="HelloGilda"></pre>
  </details>
</figure>

<figure>
  <figcaption>
    A component that stores a UNIX timestamp in state
  </figcaption>
  
  <gilda-root type="Clock"></gilda-root>

  <pre data-component-output="Clock"></pre>

  <details>
    <summary>See source code</summary>
    <pre data-component-source="Clock"></pre>
  </details>
</figure>

<figure>
  <figcaption>
    A component that manages a to-do list
  </figcaption>

  <gilda-root type="Todo"></gilda-root>

  <pre data-component-output="Todo"></pre>

  <details>
    <summary>See source code</summary>
    <pre data-component-source="Todo"></pre>
  </details>
</figure>

