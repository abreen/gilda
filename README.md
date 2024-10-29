# [`gilda`](https://github.com/abreen/gilda)

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

  <script>
function HelloGilda({ lightness = 200 }: { lightness: number }) {
  if (lightness <= 0) {
    return el("strong", null, "Gilda");
  }
  if (lightness > 200) {
    lightness = 200;
  }

  return fragment(
    el(
      "span",
      { style: `color: rgb(${lightness} ${lightness} ${lightness})` },
      "Hello"
    ),
    el(HelloGilda, { lightness: lightness - 20 })
  );
}
  </script>

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

  <script>
function Clock() {
  const [time, setTime] = useState<number>(Date.now());
  // TODO useEffect() for cleanup
  return el(
    "p",
    null,
    fragment("Current UNIX time: ", el("strong", null, `${time}`)),
    el("br"),
    el(
      "button",
      {
        onClick: () => {
          setTime(Date.now());
        }
      },
      "Update"
    )
  );
}
  </script>
  
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

  <script>
function Todo() {
  const [input, setInput] = useState<string>("");
  const [items, setItems] = useState<{ done: boolean; label: string }[]>([
    { done: false, label: "First item" },
    { done: false, label: "Second item" }
  ]);

  function handleChange(e: InputEvent) {
    const target: HTMLInputElement | null =
      e.target != null ? (e.target as HTMLInputElement) : null;
    setInput(target?.value || "");
  }

  function handleClick() {
    setItems([...items, { done: false, label: input }]);
    setInput("");
  }

  return fragment(
    el("ol", null, ...items.map((item) => el("li", null, item.label))),
    el("label", { for: "new-todo" }, "New todo"),
    el("input", {
      type: "text",
      id: "new-todo",
      value: input,
      onKeyUp: handleChange
    }),
    el(
      "button",
      {
        onClick: handleClick
      },
      "Add"
    )
  );
}
  </script>

  <gilda-root type="Todo"></gilda-root>

  <pre data-component-output="Todo"></pre>

  <details>
    <summary>See source code</summary>
    <pre data-component-source="Todo"></pre>
  </details>
</figure>

