import { RenderModes } from "constants/WidgetConstants";
import type { LayoutComponentProps } from "layoutSystems/anvil/utils/anvilTypes";
import { mockButtonProps } from "./widgetProps/button";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { mockInputProps } from "./widgetProps/input";
import type { WidgetProps } from "widgets/BaseWidget";

export function generateLayoutComponentMock(
  data: Partial<LayoutComponentProps> = {},
  rendersWidgets = true,
): LayoutComponentProps {
  if (data?.layoutType === "ALIGNED_ROW")
    return generateAlignedRowMock(data, rendersWidgets);
  const layout: string[] | LayoutComponentProps[] = [],
    childrenMap: { [key: string]: WidgetProps } = {};
  if (rendersWidgets) {
    /**
     * This generates a Row with button and input widgets in it.
     * Row
     *  Button
     *  Input
     */
    const buttonWidget: BaseWidgetProps = mockButtonProps();
    const inputWidget: BaseWidgetProps = mockInputProps();
    (layout as string[]).push(buttonWidget.widgetId);
    (layout as string[]).push(inputWidget.widgetId);
    childrenMap[buttonWidget.widgetId] = buttonWidget;
    childrenMap[inputWidget.widgetId] = inputWidget;
  } else {
    (layout as LayoutComponentProps[]).push(generateLayoutComponentMock());
    (layout as LayoutComponentProps[]).push(generateLayoutComponentMock());
  }
  return {
    layout,
    layoutId: "",
    layoutStyle: {},
    layoutType: "ROW",

    allowedWidgetTypes: [],
    canvasId: "",
    children: [],
    childTemplate: undefined,
    isDropTarget: false,
    insertChild: rendersWidgets,
    isPermanent: false,

    childrenMap,
    renderMode: RenderModes.CANVAS,
    ...data,
  };
}

/**
 * This generates an AlignedRow with button and input widgets in start alignment.
 * AlignedRow
 *  Start
 *   Button
 *   Input
 *  Center
 *  End
 */
export function generateAlignedRowMock(
  data: Partial<LayoutComponentProps> = {},
  rendersWidgets = true,
): LayoutComponentProps {
  const layout: string[][] = [[], [], []],
    childrenMap: { [key: string]: WidgetProps } = {};
  if (rendersWidgets) {
    const buttonWidget: BaseWidgetProps = mockButtonProps();
    const inputWidget: BaseWidgetProps = mockInputProps();
    layout[0].push(buttonWidget.widgetId);
    layout[0].push(inputWidget.widgetId);
    childrenMap[buttonWidget.widgetId] = buttonWidget;
    childrenMap[inputWidget.widgetId] = inputWidget;
  }
  return {
    layout,
    layoutId: "",
    layoutStyle: {},
    layoutType: "ALIGNED_ROW",

    allowedWidgetTypes: [],
    canvasId: "",
    children: [],
    childTemplate: undefined,
    isDropTarget: false,
    insertChild: rendersWidgets,
    isPermanent: false,

    childrenMap,
    renderMode: RenderModes.CANVAS,
    ...data,
  };
}