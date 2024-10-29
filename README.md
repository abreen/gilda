# [`gilda`](https://github.com/abreen/gilda)

A miniature implementation of R\*\*\*\*.

## Component

A Component is any function that returns an Element, or any renderable content, like strings. 

### The `el()` function

Create an Element, a simple representation of a piece of UI that doesn't involve actual DOM nodes. An Element can refer directly to an HTML element like `<p>`, or recursively to a Component (which eventually returns HTML).

### `fragment()`

A way to return more than one Element at once without introducing a new parent Element.

## `init(domNode, Component)`

Treat the DOM node as a container and initialize the Component into it. As state changes in the instance, Gilda only modifies the parts of the DOM that need to change.

## `render()`

Convert Elements into actual DOM nodes. This involves repeatedly calling Components to obtain the Elements they return, converting them to DOM nodes, and setting up the parent/child relationships.

## Examples

<script>
function updateRenderedOutput(name, sourceCode) {
  const els = document.getElementsByTagName('pre');
  for (let i = 0; i < els.length; i++) {
    if (els[i].dataset.componentOutput === name) {
      const prettyCode = html_beautify(sourceCode, {
        indent_size: '2',
        brace_style: 'collapse',
        wrap_line_length: '80'
      });
      const highlightedCode = hljs.highlight(prettyCode, {
        language: 'html',
      }).value;
      els[i].innerHTML = highlightedCode;
      break;
    }
  }
}

addEventListener('update', ({container: {component, domElement}}) => {
  updateRenderedOutput(component.name, domElement.outerHTML);
});
</script>

<figure>
  <figcaption>
    A recursive component that repeats and fades text
  </figcaption>

  <div id="hello-gilda"></div>

  <script defer>
function HelloGilda({ lightness = 200 }) {
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
init(document.getElementById('hello-gilda'), HelloGilda);
  </script>

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

  <div id="clock"></div>

  <script>
function Clock() {
  const [time, setTime] = useState(Date.now());
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
init(document.getElementById('clock'), Clock);
  </script>
  
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

  <div id="todo"></div>

  <script>
function Todo() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([
    { done: false, label: "First item" },
    { done: false, label: "Second item" }
  ]);

  function handleChange(e) {
    const target = e.target != null ? e.target : null;
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
init(document.getElementById('todo'), Todo);
  </script>

  <pre data-component-output="Todo"></pre>

  <details>
    <summary>See source code</summary>
    <pre data-component-source="Todo"></pre>
  </details>
</figure>
