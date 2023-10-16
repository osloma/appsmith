import { debounce } from "lodash";
import type { RefObject } from "react";
import {
  ANVIL_LAYER,
  ANVIL_WIDGET,
  LAYOUT,
  extractLayoutIdFromLayoutDOMId,
  getLayoutId,
} from "./utils";
import store from "store";
import { readWidgetPositions } from "layoutSystems/anvil/integrations/actions";
import ResizeObserver from "resize-observer-polyfill";

/**
 * This Class's main function is to batch all the registered widgets, Flex layers and layout components
 * and dispatch an action to process all the affected widgets to determine all the widgets' positions
 *
 * This inturn acts as an observer to find out update widgets positions whenever the widget position changes
 */
class WidgetPositionsObserver {
  // Objects to store registered elements
  private registeredWidgets: {
    [widgetDOMId: string]: { ref: RefObject<HTMLDivElement>; id: string };
  } = {};
  private registeredLayers: {
    [layerId: string]: {
      ref: RefObject<HTMLDivElement>;
      canvasId: string;
      layerIndex: number;
    };
  } = {};
  private registeredLayouts: {
    [layoutId: string]: {
      ref: RefObject<HTMLDivElement>;
      layoutId: string;
      canvasId: string;
      isDropTarget: boolean;
    };
  } = {};

  //Queues to process the registered elements that changed
  private widgetsProcessQueue: {
    [widgetId: string]: DOMRect | boolean;
  } = {};
  private layersProcessQueue: { [canvasId: string]: number } = {};
  private layoutsProcessQueue: { [key: string]: DOMRect | boolean } = {};

  private debouncedProcessBatch = debounce(this.processWidgetBatch, 200);

  // All the registered elements are registered with this Resize observer
  // When any of the elements changes size this observer triggers it
  // Add the elements are added to queue to further batch and process
  private resizeObserver = new ResizeObserver(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        if (entry?.target?.id) {
          const DOMId = entry?.target?.id;
          if (DOMId.indexOf(ANVIL_WIDGET) > -1) {
            this.addWidgetToProcess(DOMId);
          } else if (DOMId.indexOf(LAYOUT) > -1) {
            this.addLayoutToProcess(DOMId);
          }
        }
      }
    },
  );

  private intersectionObserver: IntersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const DOMId = entry?.target?.id;
        if (DOMId.indexOf(ANVIL_WIDGET) > -1) {
          this.addWidgetToProcess(DOMId, entry.boundingClientRect);
        } else if (DOMId.indexOf(LAYOUT) > -1) {
          this.addLayoutToProcess(DOMId, entry.boundingClientRect);
        }
      });
    },
    {
      threshold: 0,
      root: document.getElementById("intersection-root"),
    },
  );

  //Method to register widgets for resize observer changes
  public observeWidget(
    widgetId: string,
    widgetDOMId: string,
    ref: RefObject<HTMLDivElement>,
  ) {
    if (ref.current) {
      this.registeredWidgets[widgetDOMId] = { ref, id: widgetId };
      this.resizeObserver.observe(ref.current);
      this.intersectionObserver.observe(ref.current);
      this.addWidgetToProcess(widgetDOMId);
    }
  }

  //Method to de register widgets for resize observer changes
  public unObserveWidget(widgetDOMId: string) {
    const element = this.registeredWidgets[widgetDOMId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
      this.intersectionObserver.disconnect();
    }

    delete this.registeredWidgets[widgetDOMId];
  }

  //Method to register layouts for resize observer changes
  public observeLayout(
    layoutId: string,
    canvasId: string,
    isDropTarget: boolean,
    ref: RefObject<HTMLDivElement>,
  ) {
    if (ref?.current) {
      this.registeredLayouts[getLayoutId(canvasId, layoutId)] = {
        ref,
        canvasId,
        layoutId,
        isDropTarget,
      };
      this.intersectionObserver.observe(ref.current);
      this.resizeObserver.observe(ref.current);
    }
  }

  //Method to de register layouts for resize observer changes
  public unObserveLayout(layoutId: string, canvasId: string) {
    const domId = getLayoutId(canvasId, layoutId);
    const element = this.registeredLayouts[domId]?.ref?.current;
    if (element) {
      this.resizeObserver.unobserve(element);
    }
    this.intersectionObserver.disconnect();

    delete this.registeredLayouts[domId];
  }

  //This method is triggered from the resize observer to add widgets to queue
  private addWidgetToProcess(widgetDOMId: string, rect?: DOMRect) {
    if (this.registeredWidgets[widgetDOMId]) {
      const widgetId = this.registeredWidgets[widgetDOMId].id;
      this.widgetsProcessQueue[widgetId] = rect || true;
      this.debouncedProcessBatch();
    }
  }

  //This method is triggered from the resize observer to add layout to queue
  private addLayoutToProcess(layoutDOMId: string, rect?: DOMRect) {
    if (this.registeredLayouts[layoutDOMId]) {
      const layoutId = extractLayoutIdFromLayoutDOMId(layoutDOMId);
      this.layoutsProcessQueue[layoutId] = rect || true;
      this.debouncedProcessBatch();
    }
  }

  //Clear all process queues
  private clearProcessQueue() {
    this.widgetsProcessQueue = {};
    this.layoutsProcessQueue = {};
  }

  //Dispatch all the changed elements to saga for further processing to update widget positions
  private processWidgetBatch() {
    store.dispatch(
      readWidgetPositions(
        { ...this.widgetsProcessQueue },
        { ...this.layoutsProcessQueue },
      ),
    );
    this.clearProcessQueue();
  }

  public getRegisteredLayouts() {
    return this.registeredLayouts;
  }

  public getRegisteredWidgets() {
    return this.registeredWidgets;
  }
}

export const positionObserver = new WidgetPositionsObserver();
