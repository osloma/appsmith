export * from "ce/pages/Applications/PackageCardList";

import React from "react";
import styled from "styled-components";
import { Button, Icon } from "design-system";
import { noop } from "lodash";

import PackageCard from "@appsmith/pages/Applications/PackageCard";
import {
  ResourceHeading,
  CardListWrapper,
  PaddingWrapper,
  CardListContainer,
  Space,
} from "pages/Applications/CommonElements";
import { NoAppsFound } from "@appsmith/pages/Applications";
import {
  EMPTY_PACKAGE_LIST,
  createMessage,
} from "@appsmith/constants/messages";
import type { Package } from "@appsmith/constants/PackageConstants";

export type PackageCardListRendererProps = {
  isMobile: boolean;
  workspaceId: string;
  packages?: Package[];
  isFetchingPackages?: boolean;
  isCreatingPackage?: boolean;
};

const NotFoundIcon = styled(Icon)`
  && {
    margin-bottom: var(--ads-v2-spaces-3);
  }

  & svg {
    color: var(--ads-v2-color-gray-400);
    height: var(--ads-v2-spaces-11);
    width: var(--ads-v2-spaces-11);
  }
`;

function PackageCardListRenderer({
  isMobile,
  workspaceId,
  packages = [],
  isFetchingPackages = false,
  isCreatingPackage = false,
}: PackageCardListRendererProps) {
  return (
    <CardListContainer isMobile={isMobile}>
      <ResourceHeading isLoading={isFetchingPackages}>Packages</ResourceHeading>
      <Space />
      <CardListWrapper isMobile={isMobile} key={workspaceId}>
        {packages.map((pkg: any) => {
          return (
            <PaddingWrapper isMobile={isMobile} key={pkg.id}>
              <PackageCard
                isFetchingPackages={isFetchingPackages}
                isMobile={isMobile}
                key={pkg.id}
                pkg={pkg}
                workspaceId={workspaceId}
              />
            </PaddingWrapper>
          );
        })}
        {packages.length === 0 && (
          <NoAppsFound>
            <NotFoundIcon name="package" size="lg" />
            <span>{createMessage(EMPTY_PACKAGE_LIST)}</span>
            <Button
              className="t--new-package-button createnew"
              isLoading={isCreatingPackage}
              onClick={noop}
              size="md"
              startIcon="plus"
            >
              New
            </Button>
          </NoAppsFound>
        )}
      </CardListWrapper>
    </CardListContainer>
  );
}

export default PackageCardListRenderer;