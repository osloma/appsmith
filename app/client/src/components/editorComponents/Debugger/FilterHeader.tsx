import type { MutableRefObject } from "react";
import React, { useRef } from "react";
import type { DropdownOption } from "design-system-old";
import styled from "styled-components";
import { useDispatch } from "react-redux";

import { clearLogs } from "actions/debuggerActions";
import { CLEAR_LOG_TOOLTIP, createMessage } from "@appsmith/constants/messages";
import {
  Button,
  Icon,
  Option,
  SearchInput,
  Select,
  Tooltip,
} from "design-system";

const Wrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: start;
  align-items: center;
  gap: 8px;
  padding: 0 8px 8px 8px;

  .debugger-filter {
    width: 220px;
  }

  .input-container {
    max-width: 560px;
    min-width: 220px;
    flex-grow: 1;
  }
`;

type FilterHeaderProps = {
  options: DropdownOption[];
  selected: DropdownOption;
  onChange: (value: string) => void;
  onSelect: (value?: string) => void;
  defaultValue: string;
  value: string;
  searchQuery: string;
};

function FilterHeader(props: FilterHeaderProps) {
  const dispatch = useDispatch();
  const searchRef: MutableRefObject<HTMLInputElement | null> = useRef(null);
  return (
    <Wrapper>
      <Tooltip
        className="debugger-clear-logs"
        content={createMessage(CLEAR_LOG_TOOLTIP)}
        placement="bottom"
      >
        <Button
          className="t--debugger-clear-logs"
          isIconButton
          kind="tertiary"
          onClick={() => dispatch(clearLogs())}
          size="sm"
          startIcon="cancel"
        />
      </Tooltip>
      <div className="input-container">
        <SearchInput
          className="debugger-search"
          data-testid="t--debugger-search"
          onChange={props.onChange}
          placeholder="Filter"
          ref={searchRef}
          value={props.value || props.defaultValue}
        />
      </div>
      <Select
        className="debugger-filter"
        onSelect={props.onSelect}
        size="sm"
        value={{ key: props.selected.value, label: props.selected.label }}
      >
        {props.options.map((option) => (
          <Option
            aria-label={option.label}
            key={option.value}
            value={option.value}
          >
            {option.icon && <Icon name={option.icon} />}
            {option.label}
          </Option>
        ))}
      </Select>
    </Wrapper>
  );
}

export default FilterHeader;
