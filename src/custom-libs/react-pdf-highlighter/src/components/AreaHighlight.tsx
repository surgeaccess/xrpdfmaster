import React, { Component } from "react";
import AnnotContext from "../../../../component/AnnotContext";
import { Rnd } from "react-rnd";
import { getPageFromElement } from "../lib/pdfjs-dom";

import "../style/AreaHighlight.css";

import type { LTWHP, ViewportHighlight } from "../types";
import {pdfAnnotElements} from "../../../../services/helper-function.service";
interface Props {
  highlight: ViewportHighlight;
  onChange: (rect: LTWHP) => void;
  isScrolledTo: boolean;
}

export class AreaHighlight extends Component<Props> {
  static contextType?: React.Context<any> = AnnotContext;
  customEle: Array<any> = pdfAnnotElements as unknown as Array<any>;
  getSelectedHighlight = (comment) => {
    let selectedOpt = {ele: {}};
    // TODO: eventually change this to assign get comments based off of the mode
    // mode can be annot/proc
    if (comment.constructor.name === "Array") {
      selectedOpt = this.customEle.find(
        (ele) => ele.key === comment[0]?.icon
      );
    } else{
      selectedOpt = this.customEle.find(
        (ele) => ele.key === comment?.icon 
      );
    }
    return selectedOpt?.ele;
  };
  
  render() {
    const { highlight, onChange, isScrolledTo, ...otherProps } = this.props;
    const hltRectMid = highlight.position.boundingRect.top + highlight.position.boundingRect.height/2;
    return (
      <div
        className={`AreaHighlight ${
          isScrolledTo ? "AreaHighlight--scrolledTo" : ""
        }`}
      >
        {highlight?.comment ? (
          <div
            className="Highlight__emoji"
            style={{
              left: highlight.position.boundingRect.left - 1,
              top: hltRectMid - 10 ,
              zIndex: 1,
            }}
            onClick={()=>this.context?.action({
              type: 'select-annot-id',
              data: highlight?.id,
          })}
          >
            {this.getSelectedHighlight(highlight?.comment)}
          </div>
        ) : null}
        <Rnd
          className="AreaHighlight__part"
          onDragStop={(_, data) => {
            const boundingRect: LTWHP = {
              ...highlight.position.boundingRect,
              top: data.y,
              left: data.x,
            };

            onChange(boundingRect);
          }}
          onResizeStop={(_mouseEvent, _direction, ref, _delta, position) => {
            const boundingRect: LTWHP = {
              top: position.y,
              left: position.x,
              width: ref.offsetWidth,
              height: ref.offsetHeight,
              pageNumber: getPageFromElement(ref)?.number || -1,
            };

            onChange(boundingRect);
          }}
          position={{
            x: highlight.position.boundingRect.left,
            y: highlight.position.boundingRect.top,
          }}
          size={{
            width: highlight.position.boundingRect.width,
            height: highlight.position.boundingRect.height,
          }}
          onClick={(event: Event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
          {...otherProps}
        />
   
      </div>
    );
  }
}
export default AreaHighlight;
