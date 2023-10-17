import type React from "react";
import { useEffect, useRef } from "react";
import { getNearestParentCanvas } from "utils/generators";
import type { AnvilHighlightingCanvasProps } from "../AnvilHighlightingCanvas";
import { useCanvasDragToScroll } from "layoutSystems/common/canvasArenas/useCanvasDragToScroll";
import { Colors } from "constants/Colors";
import type { AnvilHighlightInfo } from "layoutSystems/anvil/utils/anvilTypes";
import { getAbsolutePixels } from "utils/helpers";

/**
 * function to render UX to denote that the widget type cannot be dropped in the layout
 */

const renderDisallowOnCanvas = (slidingArena: HTMLDivElement) => {
  slidingArena.style.backgroundColor = "red";
  slidingArena.style.color = "white";
  slidingArena.innerText = "This Layout Doesn't support the widget";
};

/**
 * function to stroke a rectangle on the canvas that looks like a highlight/drop area.
 */

const renderBlocksOnCanvas = (
  stickyCanvas: HTMLCanvasElement,
  blockToRender: AnvilHighlightInfo,
) => {
  const topOffset = getAbsolutePixels(stickyCanvas.style.top);
  const leftOffset = getAbsolutePixels(stickyCanvas.style.left);
  const canvasCtx = stickyCanvas.getContext("2d") as CanvasRenderingContext2D;
  canvasCtx.clearRect(0, 0, stickyCanvas.width, stickyCanvas.height);
  canvasCtx.stroke();
  canvasCtx.beginPath();
  canvasCtx.fillStyle = Colors.HIGHLIGHT_FILL;
  canvasCtx.lineWidth = 1;
  canvasCtx.strokeStyle = Colors.HIGHLIGHT_OUTLINE;
  canvasCtx.setLineDash([]);
  const { height, posX, posY, width } = blockToRender;
  // roundRect is not currently supported in firefox.
  if (canvasCtx.roundRect)
    canvasCtx.roundRect(posX - leftOffset, posY - topOffset, width, height, 4);
  else canvasCtx.rect(posX - leftOffset, posY - topOffset, width, height);
  canvasCtx.fill();
  canvasCtx.stroke();
};

/**
 *
 *  This hook is written to accumulate all logic that is needed to
 *  - initialize event listeners for canvas
 *  - adjust z-index of canvas
 *  - track mouse position on canvas
 *  - render highlights on the canvas
 *  - render warning to denote that a particular widget type is not allowed to drop on canvas
 *  - auto scroll canvas when needed.
 *  - invoke onDrop callback as per the anvilDragStates
 */
export const useCanvasDragging = (
  slidingArenaRef: React.RefObject<HTMLDivElement>,
  stickyCanvasRef: React.RefObject<HTMLCanvasElement>,
  props: AnvilHighlightingCanvasProps,
) => {
  const { anvilDragStates, deriveAllHighlightsFn, onDrop, renderOnMouseMove } =
    props;
  const {
    draggedBlocks,
    isCurrentDraggedCanvas,
    isDragging,
    isResizing,
    widgetPositions,
  } = anvilDragStates;

  const canScroll = useCanvasDragToScroll(
    slidingArenaRef,
    isCurrentDraggedCanvas,
    isDragging,
  );
  const allHighlightsRef = useRef([] as AnvilHighlightInfo[]);
  const calculateHighlights = () => {
    allHighlightsRef.current = deriveAllHighlightsFn(
      widgetPositions,
      draggedBlocks,
    );
  };

  useEffect(() => {
    if (stickyCanvasRef.current && slidingArenaRef.current) {
      if (!anvilDragStates.isCurrentDraggedCanvas) {
        const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
        canvasCtx.clearRect(
          0,
          0,
          stickyCanvasRef.current.width,
          stickyCanvasRef.current.height,
        );
        slidingArenaRef.current.style.zIndex = "";
        slidingArenaRef.current.style.backgroundColor = "unset";
        slidingArenaRef.current.style.color = "unset";
        slidingArenaRef.current.innerText = "";
      } else {
        slidingArenaRef.current.style.zIndex = "2";
      }
    }
  }, [anvilDragStates.isCurrentDraggedCanvas]);

  useEffect(() => {
    if (slidingArenaRef.current && !isResizing && isDragging) {
      const scrollParent: Element | null = getNearestParentCanvas(
        slidingArenaRef.current,
      );

      let canvasIsDragging = false;
      let currentRectanglesToDraw: AnvilHighlightInfo;
      const scrollObj: any = {};
      const resetCanvasState = () => {
        if (stickyCanvasRef.current && slidingArenaRef.current) {
          const canvasCtx: any = stickyCanvasRef.current.getContext("2d");
          canvasCtx.clearRect(
            0,
            0,
            stickyCanvasRef.current.width,
            stickyCanvasRef.current.height,
          );
          slidingArenaRef.current.style.zIndex = "";
          slidingArenaRef.current.style.backgroundColor = "unset";
          slidingArenaRef.current.style.color = "unset";
          slidingArenaRef.current.innerText = "";
          canvasIsDragging = false;
        }
      };

      if (isDragging) {
        const onMouseUp = () => {
          if (
            isDragging &&
            canvasIsDragging &&
            currentRectanglesToDraw &&
            anvilDragStates.allowToDrop
          ) {
            onDrop(currentRectanglesToDraw);
          }
          resetCanvasState();
        };

        const onFirstMoveOnCanvas = (e: MouseEvent) => {
          if (
            !isResizing &&
            isDragging &&
            !canvasIsDragging &&
            slidingArenaRef.current
          ) {
            // calculate highlights when mouse enters the canvas
            calculateHighlights();
            canvasIsDragging = true;
            onMouseMove(e);
          }
        };

        const onMouseMove = (e: any) => {
          if (
            isDragging &&
            canvasIsDragging &&
            slidingArenaRef.current &&
            stickyCanvasRef.current
          ) {
            if (!anvilDragStates.allowToDrop) {
              renderDisallowOnCanvas(slidingArenaRef.current);
              return;
            }
            const processedHighlight = renderOnMouseMove(
              e,
              allHighlightsRef.current,
            );
            if (processedHighlight) {
              currentRectanglesToDraw = processedHighlight;
              renderBlocksOnCanvas(
                stickyCanvasRef.current,
                currentRectanglesToDraw,
              );
              scrollObj.lastMouseMoveEvent = {
                offsetX: e.offsetX,
                offsetY: e.offsetY,
              };
              scrollObj.lastScrollTop = scrollParent?.scrollTop;
              scrollObj.lastScrollHeight = scrollParent?.scrollHeight;
            }
          } else {
            onFirstMoveOnCanvas(e);
          }
        };

        // Adding setTimeout to make sure this gets called after
        // the onscroll that resets intersectionObserver in StickyCanvasArena.tsx
        const onScroll = () =>
          setTimeout(() => {
            const { lastMouseMoveEvent, lastScrollHeight, lastScrollTop } =
              scrollObj;
            if (
              lastMouseMoveEvent &&
              lastScrollHeight &&
              lastScrollTop &&
              scrollParent &&
              canScroll.current
            ) {
              const delta =
                scrollParent?.scrollHeight +
                scrollParent?.scrollTop -
                (lastScrollHeight + lastScrollTop);
              onMouseMove({
                offsetX: lastMouseMoveEvent.offsetX,
                offsetY: lastMouseMoveEvent.offsetY + delta,
              });
            }
          }, 0);

        //Initialize Listeners
        const initializeListeners = () => {
          slidingArenaRef.current?.addEventListener(
            "mousemove",
            onMouseMove,
            false,
          );
          slidingArenaRef.current?.addEventListener(
            "mouseup",
            onMouseUp,
            false,
          );
          scrollParent?.addEventListener("scroll", onScroll, false);
        };
        const startDragging = () => {
          if (
            slidingArenaRef.current &&
            stickyCanvasRef.current &&
            scrollParent
          ) {
            initializeListeners();
          }
        };
        startDragging();

        return () => {
          slidingArenaRef.current?.removeEventListener(
            "mousemove",
            onMouseMove,
          );
          slidingArenaRef.current?.removeEventListener("mouseup", onMouseUp);
          scrollParent?.removeEventListener("scroll", onScroll);
        };
      } else {
        resetCanvasState();
      }
    }
  }, [isDragging, isResizing, anvilDragStates]);
  return {
    showCanvas: isDragging && !isResizing,
  };
};