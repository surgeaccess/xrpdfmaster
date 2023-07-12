import React, { Component } from "react";

import { asElement, isHTMLElement } from "../lib/pdfjs-dom";
import "../style/MouseSelection.css";

import type { LTWH } from "../types.js";

interface Coords {
  x: number;
  y: number;
}

interface State {
  locked: boolean;
  start: Coords | null;
  end: Coords | null;
}

interface Props {
  onSelection: (
    startTarget: HTMLElement,
    boundingRect: LTWH,
    resetSelection: () => void
  ) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  shouldStart: (event: MouseEvent | TouchEvent) => boolean;
  onChange: (isVisible: boolean) => void;
}

class MouseSelection extends Component<Props, State> {
  state: State = {
    locked: false,
    start: null,
    end: null,
  };

  root?: HTMLElement;
  containerBoundingRect: DOMRect | null = null;

  reset = () => {
    const { onDragEnd } = this.props;

    onDragEnd();
    this.setState({ start: null, end: null, locked: false });
  };

  getBoundingRect(start: Coords, end: Coords): LTWH {
    return {
      left: Math.min(end.x, start.x),
      top: Math.min(end.y, start.y),

      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  containerCoords = (pageX: number, pageY: number, container) => {
    if (!this.containerBoundingRect) {
      this.containerBoundingRect = container.getBoundingClientRect();
    }

    return {
      x: pageX - this.containerBoundingRect.left + container.scrollLeft,
      y:
        pageY -
        this.containerBoundingRect.top +
        container.scrollTop -
        window.scrollY,
    };
  };

  selectionMoved(event, container: HTMLElement, isTouch: boolean) {
    const { onSelection, onDragStart, onDragEnd, shouldStart } = this.props;
    const touch = isTouch ? event?.changedTouches[0] : event; 
    if (!shouldStart(event)) {
      this.reset();
      return;
    }

    const startTarget = asElement(event.target);
    if (!isHTMLElement(startTarget)) {
      return;
    }

    onDragStart();

    this.setState({
      start: this.containerCoords(touch.pageX, touch.pageY, container),
      end: null,
      locked: false,
    });

    const onSelectionUp = (event, isTouch = false): void => {
      // emulate listen once
      isTouch ? event.currentTarget?.removeEventListener(
        "touchend",
        onSelectionUp as EventListener
      ):
      event.currentTarget?.removeEventListener("mouseup", onSelectionUp as EventListener);
      const { start } = this.state;
      const touch = isTouch ? event?.changedTouches[0] : event;

      if (!start) {
        return;
      }

      const end = this.containerCoords(touch.pageX, touch.pageY, container);

      const boundingRect = this.getBoundingRect(start, end);

      if (
        !isHTMLElement(event.target) ||
        !container.contains(asElement(event.target)) ||
        !this.shouldRender(boundingRect)
      ) {
        this.reset();
        return;
      }

      this.setState(
        {
          end,
          locked: true,
        },
        () => {
          const { start, end } = this.state;

          if (!start || !end) {
            return;
          }

          if (isHTMLElement(event.target)) {
            onSelection(startTarget, boundingRect, this.reset);

            onDragEnd();
          }
        }
      );
    };

    const { ownerDocument: doc } = container;
    if (doc.body) {
      isTouch ? doc.body.addEventListener("touchend", (event) => {
        onSelectionUp(event, true);
      }) 
      : doc.body.addEventListener("mouseup", (event) => {
        onSelectionUp(event);
      });
    }
  }

  componentDidUpdate() {
    const { onChange } = this.props;
    const { start, end } = this.state;

    const isVisible = Boolean(start && end);

    onChange(isVisible);
  }

  componentDidMount() {
    if (!this.root) {
      return;
    }

    const that = this;

    const container = asElement(this.root.parentElement);

    if (!isHTMLElement(container)) {
      return;
    }

    container.addEventListener("mousemove", (event: MouseEvent) => {
      const { start, locked } = this.state;

      if (!start || locked) {
        return;
      }

      that.setState({
        ...this.state,
        end: this.containerCoords(event.pageX, event.pageY, container),
      });
    });

    container.addEventListener("touchmove", (event: TouchEvent) => {
      const touch = event?.changedTouches[0];
      const { start, locked } = this.state;

      if (!start || locked) {
        return;
      }

      that.setState({
        ...this.state,
        end: this.containerCoords(touch.pageX, touch.pageY, container),
      });
    });

    container.addEventListener("mousedown", (event: MouseEvent) => {
      this.selectionMoved(event,container,false);
    });
    container.addEventListener("touchstart",(event: TouchEvent) => {
      this.selectionMoved(event,container,true);
    })
  }

  shouldRender(boundingRect: LTWH) {
    return boundingRect.width >= 1 && boundingRect.height >= 1;
  }

  render() {
    const { start, end } = this.state;

    return (
      <div
        className="MouseSelection-container"
        ref={(node) => {
          if (!node) {
            return;
          }
          this.root = node;
        }}
      >
        {start && end ? (
          <div
            className="MouseSelection"
            style={this.getBoundingRect(start, end)}
          />
        ) : null}
      </div>
    );
  }
}

export default MouseSelection;
