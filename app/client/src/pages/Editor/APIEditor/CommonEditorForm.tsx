import React, { useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  API_EDITOR_TABS,
  HTTP_METHOD_OPTIONS,
} from "constants/ApiEditorConstants/CommonApiConstants";
import { GRAPHQL_HTTP_METHOD_OPTIONS } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import styled from "styled-components";
import FormLabel from "components/editorComponents/FormLabel";
import FormRow from "components/editorComponents/FormRow";
import type {
  ActionResponse,
  PaginationField,
  SuggestedWidget,
} from "api/ActionAPI";
import type { Action, PaginationType } from "entities/Action";
import { isGraphqlPlugin } from "entities/Action";
import KeyValueFieldArray from "components/editorComponents/form/fields/KeyValueFieldArray";
import ApiResponseView from "components/editorComponents/ApiResponseView";
import EmbeddedDatasourcePathField from "components/editorComponents/form/fields/EmbeddedDatasourcePathField";
import type { AppState } from "@appsmith/reducers";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import ActionSettings from "pages/Editor/ActionSettings";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { Classes } from "design-system-old";
import {
  Button,
  Callout,
  Icon,
  Tab,
  Tabs,
  TabsList,
  TabPanel,
  Tooltip,
  Text,
} from "design-system";
import {
  API_EDITOR_TAB_TITLES,
  API_PANE_AUTO_GENERATED_HEADER,
  API_PANE_DUPLICATE_HEADER,
  createMessage,
} from "@appsmith/constants/messages";
import { useParams } from "react-router";
import DataSourceList from "./ApiRightPane";
import type { Datasource } from "entities/Datasource";
import equal from "fast-deep-equal/es6";

import ApiAuthentication from "./ApiAuthentication";
import { replayHighlightClass } from "globalStyles/portals";
import { getPlugin } from "@appsmith/selectors/entitiesSelector";
import { setApiPaneConfigSelectedTabIndex } from "actions/apiPaneActions";
import type { AutoGeneratedHeader } from "./helpers";
import {
  getApiPaneConfigSelectedTabIndex,
  showApiPaneDebugger,
} from "selectors/apiPaneSelectors";
import { noop } from "lodash";
import { DEFAULT_DATASOURCE_NAME } from "constants/ApiEditorConstants/ApiEditorConstants";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import {
  getHasExecuteActionPermission,
  getHasManageActionPermission,
} from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";
import { ApiEditorContext } from "./ApiEditorContext";

const Form = styled.form`
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  width: 100%;
  ${FormLabel} {
    padding: ${(props) => props.theme.spaces[3]}px;
  }
  ${FormRow} {
    align-items: center;
    ${FormLabel} {
      padding: 0;
      width: 100%;
    }
  }
  .api-info-row {
    input {
      margin-left: ${(props) => props.theme.spaces[1] + 1}px;
    }
  }
`;

const MainConfiguration = styled.div`
  z-index: 7;
  padding: 0 var(--ads-v2-spaces-7);
  .api-info-row {
    padding-top: var(--ads-v2-spaces-5);
    .ads-v2-select > .rc-select-selector {
      min-width: 110px;
      width: 110px;
    }
  }
  .form-row-header {
    padding-top: var(--ads-v2-spaces-5);
  }
`;

const ActionButtons = styled.div`
  justify-self: flex-end;
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
`;

const HelpSection = styled.div`
  padding: var(--ads-v2-spaces-4) var(--ads-v2-spaces-7);
`;

const DatasourceWrapper = styled.div`
  margin-left: 8px;
  width: 100%;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  width: 100%;
`;

export const TabbedViewContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  height: 100%;

  ${FormRow} {
    min-height: auto;
    padding: ${(props) => props.theme.spaces[0]}px;
    & > * {
      margin-right: 0px;
    }
  }
`;

const TabsListWrapper = styled.div`
  padding: 0 var(--ads-v2-spaces-7);
`;

const SettingsWrapper = styled.div`
  padding: var(--ads-v2-spaces-4) 0;
  height: 100%;
  ${FormLabel} {
    padding: 0px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 135px);
  position: relative;
`;

const MainContainer = styled.div`
  display: flex;
  position: relative;
  height: 100%;
  flex-direction: column;
  /* padding: var(--ads-v2-spaces-7); */
`;
export interface CommonFormProps {
  actionResponse?: ActionResponse;
  pluginId: string;
  onRunClick: (paginationField?: PaginationField) => void;
  onDeleteClick: () => void;
  isRunning: boolean;
  isDeleting: boolean;
  paginationType: PaginationType;
  appName: string;
  actionConfigurationHeaders?: any;
  actionConfigurationParams?: any;
  datasourceHeaders?: any;
  datasourceParams?: any;
  actionName: string;
  apiId: string;
  apiName: string;
  headersCount: number;
  paramsCount: number;
  settingsConfig: any;
  hintMessages?: Array<string>;
  datasources?: any;
  currentPageId?: string;
  applicationId?: string;
  hasResponse: boolean;
  responseDataTypes: { key: string; title: string }[];
  responseDisplayFormat: { title: string; value: string };
  suggestedWidgets?: SuggestedWidget[];
  updateDatasource: (datasource: Datasource) => void;
  currentActionDatasourceId: string;
  autoGeneratedActionConfigHeaders?: AutoGeneratedHeader[];
}

type CommonFormPropsWithExtraParams = CommonFormProps & {
  formName: string;
  // Body Tab Component which is passed on from the Parent Component
  bodyUIComponent: JSX.Element;
  // Pagination Tab Component which is passed on from the Parent Component
  paginationUIComponent: JSX.Element;
  handleSubmit: any;
  // defaultSelectedTabIndex
  defaultTabSelected?: number;
  closeEditorLink?: React.ReactNode;
};

export const NameWrapper = styled.div`
  display: flex;
  align-items: center;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const Flex = styled.div<{
  size: number;
  isInvalid?: boolean;
}>`
  flex: ${(props) => props.size};
  width: 100%;
  position: relative;
  min-height: 36px;
  height: auto;
  border-color: var(--ads-v2-color-border);
  border-bottom: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  color: var(--ads-v2-color-fg);
  display: flex;
  align-items: center;
  justify-content: space-between;

  &.possible-overflow-key,
  &.possible-overflow {
    overflow: hidden;
    text-overflow: ellipsis;
    width: fit-content;
    max-width: 100%;
    div {
      padding: 0 6px;
    }
  }

  &.possible-overflow {
    width: 0;
    max-height: 36px;

    & > span.cs-text {
      width: 100%;
    }
  }

  & span {
    ${(props) =>
      props?.isInvalid
        ? "text-decoration: line-through;"
        : "text-decoration: none;"}
  }
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% - 42px);

  .key-value {
    .${Classes.TEXT} {
      color: var(--ads-v2-color-fg);
      padding: ${(props) => props.theme.spaces[2]}px 0px
        ${(props) => props.theme.spaces[2]}px
        ${(props) => props.theme.spaces[5]}px;
    }
    border-bottom: 0px;
  }
  .key-value-header {
    color: var(--ads-v2-color-fg);
    border-bottom: 0px;
    &:nth-child(2) {
      margin-left: 5px;
    }
  }
  .key-value:nth-child(2) {
    margin-left: 5px;
  }
  .disabled {
    background: var(--ads-v2-color-bg-subtle);
    border: 1px solid var(--ads-v2-color-border-muted);
    margin-bottom: ${(props) => props.theme.spaces[2] - 1}px;
  }
`;

const KeyValueStackContainer = styled.div`
  padding: 0;
`;

const KeyValueFlexContainer = styled.div`
  padding: ${(props) => props.theme.spaces[4]}px
    ${(props) => props.theme.spaces[14]}px 0 0;
`;

const FormRowWithLabel = styled(FormRow)`
  flex-wrap: wrap;
  ${FormLabel} {
    width: 100%;
  }
`;

const CenteredIcon = styled(Icon)`
  align-self: center;
  margin-right: 5px;
`;
const StyledTabPanel = styled(TabPanel)`
  height: calc(100% - 50px);
  overflow: auto;
  padding: 0 var(--ads-v2-spaces-7);
`;

function ImportedKeyValue(props: {
  datas: { key: string; value: string; isInvalid?: boolean }[];
  keyValueName: string;
}) {
  return (
    <>
      {props.datas.map((data: any, index: number) => {
        let tooltipContentValue = data?.value;
        let tooltipContentKey = data?.key;

        if ("isInvalid" in data) {
          if (data?.isInvalid) {
            tooltipContentValue = createMessage(
              API_PANE_DUPLICATE_HEADER,
              data?.key,
            );
            tooltipContentKey = createMessage(
              API_PANE_DUPLICATE_HEADER,
              data?.key,
            );
          } else {
            tooltipContentValue = "";
            tooltipContentKey = "";
          }
        }

        return (
          <FormRowWithLabel key={index}>
            <FlexContainer>
              <Flex
                className="key-value disabled possible-overflow-key"
                isInvalid={data?.isInvalid}
                size={1}
              >
                <Tooltip content={tooltipContentKey} placement="bottom">
                  <Text
                    className={`t--${props?.keyValueName}-key-${index}`}
                    kind="body-s"
                  >
                    <div>{data.key}</div>
                  </Text>
                </Tooltip>
                {"isInvalid" in data && !data?.isInvalid && (
                  <Tooltip
                    content={createMessage(API_PANE_AUTO_GENERATED_HEADER)}
                    placement="bottom"
                  >
                    <CenteredIcon
                      className={`t--auto-generated-${data.key}-info`}
                      name="question-line"
                      size="md"
                    />
                  </Tooltip>
                )}
              </Flex>
              <Flex
                className="key-value disabled possible-overflow"
                isInvalid={data?.isInvalid}
                size={3}
              >
                <Text
                  className={`t--${props?.keyValueName}-value-${index}`}
                  kind="body-s"
                >
                  <Tooltip content={tooltipContentValue} placement="bottom">
                    <div>{data.value}</div>
                  </Tooltip>
                </Text>
              </Flex>
            </FlexContainer>
          </FormRowWithLabel>
        );
      })}
    </>
  );
}

function renderImportedDatasButton(
  dataCount: number,
  onClick: any,
  showInheritedAttributes: boolean,
  attributeName: string,
) {
  return (
    // TODO: Maybe this should be a Toggle Button? ̦
    <Button
      className="t--show-imported-datas"
      kind="tertiary"
      onClick={(e) => {
        e.preventDefault();
        onClick(!showInheritedAttributes);
      }}
      size="sm"
      startIcon={showInheritedAttributes ? "eye-on" : "eye-off"}
    >
      {showInheritedAttributes
        ? `${attributeName}`
        : `${dataCount} ${attributeName}`}
    </Button>
  );
}

function ImportedDatas(props: {
  data: any;
  autogeneratedHeaders?: any;
  attributeName: string;
}) {
  const [showDatas, toggleDatas] = useState(false);
  // commenting this out for whenever we decide to add a button to toggle auto-generated headers
  // const [showAutoGeneratedHeader, toggleAutoGeneratedHeaders] = useState(true);
  return (
    <>
      <KeyValueFlexContainer>
        {props?.data &&
          props.data.length > 0 &&
          renderImportedDatasButton(
            props.data.length,
            toggleDatas,
            showDatas,
            `Inherited ${props.attributeName}${
              props.data.length > 1 ? "s" : ""
            }`,
          )}

        {/* commenting this out for whenever we decide to add a button to toggle auto-generated headers */}
        {/* {props?.autogeneratedHeaders &&
          props?.autogeneratedHeaders?.length > 0 &&
          renderImportedDatasButton(
            props?.autogeneratedHeaders?.length,
            toggleAutoGeneratedHeaders,
            showAutoGeneratedHeader,
            `Auto Generated Header${
              props?.autogeneratedHeaders?.length > 1 ? "s" : ""
            }`,
          )} */}
      </KeyValueFlexContainer>
      <KeyValueStackContainer>
        <FormRowWithLabel>
          <FlexContainer className="header">
            <Flex className="key-value-header" size={1}>
              <Text kind="body-m">Key</Text>
            </Flex>
            <Flex className="key-value-header" size={3}>
              <Text kind="body-m">Value</Text>
            </Flex>
          </FlexContainer>
        </FormRowWithLabel>
        {props?.data && props?.data?.length > 0 && showDatas && (
          <ImportedKeyValue
            datas={props.data}
            keyValueName={props?.attributeName}
          />
        )}
        {props?.autogeneratedHeaders &&
          props?.autogeneratedHeaders?.length > 0 && (
            <ImportedKeyValue
              datas={props.autogeneratedHeaders}
              keyValueName={"autoGeneratedHeader"}
            />
          )}
      </KeyValueStackContainer>
    </>
  );
}

/**
 * Commons editor form which is being used by API and GraphQL. Since most of the things were common to both so picking out the common part was a better option. For now Body and Pagination component are being passed on by the using component.
 * @param props type CommonFormPropsWithExtraParams
 * @returns Editor with respect to which type is using it
 */
function CommonEditorForm(props: CommonFormPropsWithExtraParams) {
  // the redux form has been configured with indexes, but the new ads components need strings to work.
  // these functions convert them back and forth as needed.
  const selectedIndex = useSelector(getApiPaneConfigSelectedTabIndex);
  const selectedValue = Object.values(API_EDITOR_TABS)[selectedIndex];
  const setSelectedIndex = (value: API_EDITOR_TABS) => {
    const index = Object.values(API_EDITOR_TABS).indexOf(value);
    dispatch(setApiPaneConfigSelectedTabIndex(index));
  };
  const {
    actionRightPaneAdditionSections,
    actionRightPaneBackLink,
    moreActionsMenu,
    notification,
    saveActionName,
    showRightPaneTabbedSection = true,
  } = useContext(ApiEditorContext);

  const {
    actionConfigurationHeaders,
    actionConfigurationParams,
    actionName,
    actionResponse,
    autoGeneratedActionConfigHeaders,
    closeEditorLink,
    currentActionDatasourceId,
    formName,
    handleSubmit,
    headersCount,
    hintMessages,
    isRunning,
    onRunClick,
    paramsCount,
    pluginId,
    responseDataTypes,
    responseDisplayFormat,
    settingsConfig,
    updateDatasource,
  } = props;
  const dispatch = useDispatch();

  const params = useParams<{ apiId?: string; queryId?: string }>();

  // passing lodash's equality function to ensure that this selector does not cause a rerender multiple times.
  // it checks each value to make sure none has changed before recomputing the actions.
  const actions: Action[] = useSelector(
    (state: AppState) => state.entities.actions.map((action) => action.config),
    equal,
  );

  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const isChangePermitted = getHasManageActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );
  const isExecutePermitted = getHasExecuteActionPermission(
    isFeatureEnabled,
    currentActionConfig?.userPermissions,
  );

  const plugin = useSelector((state: AppState) =>
    getPlugin(state, pluginId ?? ""),
  );

  // this gets the url of the current action's datasource
  const actionDatasourceUrl =
    currentActionConfig?.datasource?.datasourceConfiguration?.url || "";
  const actionDatasourceUrlPath =
    currentActionConfig?.actionConfiguration?.path || "";
  // this gets the name of the current action's datasource
  const actionDatasourceName = currentActionConfig?.datasource.name || "";

  // if the url is empty and the action's datasource name is the default datasource name (this means the api does not have a datasource attached)
  // or the user does not have permission,
  // we block action execution.
  const blockExecution =
    (!actionDatasourceUrl &&
      !actionDatasourceUrlPath &&
      actionDatasourceName === DEFAULT_DATASOURCE_NAME) ||
    !isExecutePermitted;

  // Debugger render flag
  const showDebugger = useSelector(showApiPaneDebugger);

  const isGraphql = isGraphqlPlugin(plugin);

  const theme = EditorTheme.LIGHT;

  return (
    <MainContainer>
      {closeEditorLink}
      <Form onSubmit={handleSubmit(noop)}>
        <MainConfiguration>
          <FormRow className="form-row-header">
            <NameWrapper className="t--nameOfApi">
              <ActionNameEditor
                disabled={!isChangePermitted}
                enableFontStyling
                saveActionName={saveActionName}
              />
            </NameWrapper>
            <ActionButtons className="t--formActionButtons">
              {moreActionsMenu}
              <Button
                className="t--apiFormRunBtn"
                isDisabled={blockExecution}
                isLoading={isRunning}
                onClick={() => {
                  onRunClick();
                }}
                size="md"
              >
                Run
              </Button>
            </ActionButtons>
          </FormRow>
          {notification}
          <FormRow className="api-info-row">
            <div>
              {/* eslint-disable-next-line */}
              {/* @ts-ignore*/}
              <RequestDropdownField
                className={`t--apiFormHttpMethod ${replayHighlightClass}`}
                data-location-id={btoa("actionConfiguration.httpMethod")}
                disabled={!isChangePermitted}
                name="actionConfiguration.httpMethod"
                options={
                  isGraphql ? GRAPHQL_HTTP_METHOD_OPTIONS : HTTP_METHOD_OPTIONS
                }
                placeholder="Method"
                width={"110px"}
              />
            </div>
            <DatasourceWrapper className="t--dataSourceField">
              <EmbeddedDatasourcePathField
                actionName={actionName}
                codeEditorVisibleOverflow
                formName={formName}
                name="actionConfiguration.path"
                placeholder="https://mock-api.appsmith.com/users"
                pluginId={pluginId}
                theme={theme}
              />
            </DatasourceWrapper>
          </FormRow>
        </MainConfiguration>
        {hintMessages && (
          <HelpSection>
            {hintMessages.map((msg, i) => (
              <Callout key={i} kind="info">
                {msg}
              </Callout>
            ))}
          </HelpSection>
        )}
        <Wrapper>
          <SecondaryWrapper>
            <TabbedViewContainer>
              <Tabs
                className="h-full"
                defaultValue={
                  isGraphql ? API_EDITOR_TABS.BODY : API_EDITOR_TABS.HEADERS
                }
                // eslint-disable-next-line
                //@ts-ignore
                onValueChange={setSelectedIndex}
                value={selectedValue}
              >
                <TabsListWrapper>
                  <TabsList>
                    {Object.values(API_EDITOR_TABS).map((tab) => (
                      <Tab
                        data-testid={`t--api-editor-${tab}`}
                        key={tab}
                        notificationCount={
                          tab == "HEADERS"
                            ? headersCount
                            : tab == "PARAMS"
                            ? paramsCount
                            : undefined
                        }
                        value={tab}
                      >
                        {createMessage(API_EDITOR_TAB_TITLES[tab])}
                      </Tab>
                    ))}
                  </TabsList>
                </TabsListWrapper>
                <StyledTabPanel value={API_EDITOR_TABS.HEADERS}>
                  <ImportedDatas
                    attributeName="header"
                    autogeneratedHeaders={autoGeneratedActionConfigHeaders}
                    data={props.datasourceHeaders}
                  />
                  <KeyValueFieldArray
                    actionConfig={actionConfigurationHeaders}
                    dataTreePath={`${actionName}.config.headers`}
                    hideHeader
                    label="Headers"
                    name="actionConfiguration.headers"
                    placeholder="Value"
                    pushFields={isChangePermitted}
                    theme={theme}
                  />
                </StyledTabPanel>
                <StyledTabPanel value={API_EDITOR_TABS.PARAMS}>
                  <ImportedDatas
                    attributeName={"param"}
                    data={props.datasourceParams}
                  />
                  <KeyValueFieldArray
                    actionConfig={actionConfigurationParams}
                    dataTreePath={`${actionName}.config.queryParameters`}
                    hideHeader
                    label="Params"
                    name="actionConfiguration.queryParameters"
                    pushFields={isChangePermitted}
                    theme={theme}
                  />
                </StyledTabPanel>
                <StyledTabPanel className="h-full" value={API_EDITOR_TABS.BODY}>
                  {props.bodyUIComponent}
                </StyledTabPanel>
                <StyledTabPanel value={API_EDITOR_TABS.PAGINATION}>
                  {props.paginationUIComponent}
                </StyledTabPanel>
                <StyledTabPanel value={API_EDITOR_TABS.AUTHENTICATION}>
                  <ApiAuthentication formName={formName} />
                </StyledTabPanel>
                <StyledTabPanel value={API_EDITOR_TABS.SETTINGS}>
                  <SettingsWrapper>
                    <ActionSettings
                      actionSettingsConfig={settingsConfig}
                      formName={formName}
                      theme={theme}
                    />
                  </SettingsWrapper>
                </StyledTabPanel>
              </Tabs>
            </TabbedViewContainer>
            {showDebugger && (
              <ApiResponseView
                actionResponse={actionResponse}
                apiName={actionName}
                currentActionConfig={currentActionConfig}
                disabled={!isExecutePermitted}
                isRunning={isRunning}
                onRunClick={onRunClick}
                responseDataTypes={responseDataTypes}
                responseDisplayFormat={responseDisplayFormat}
                theme={theme}
              />
            )}
          </SecondaryWrapper>
          <DataSourceList
            actionName={actionName}
            actionRightPaneBackLink={actionRightPaneBackLink}
            additionalSections={actionRightPaneAdditionSections}
            applicationId={props.applicationId}
            currentActionDatasourceId={currentActionDatasourceId}
            currentPageId={props.currentPageId}
            datasourceId={props.currentActionDatasourceId}
            datasources={props.datasources}
            hasResponse={props.hasResponse}
            onClick={updateDatasource}
            pluginId={props.pluginId}
            showTabbedSection={showRightPaneTabbedSection}
            suggestedWidgets={props.suggestedWidgets}
          />
        </Wrapper>
      </Form>
    </MainContainer>
  );
}

export default CommonEditorForm;
