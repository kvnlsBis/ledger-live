import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import React from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import RetryButton from "~/renderer/components/RetryButton";
import SuccessDisplay from "~/renderer/components/SuccessDisplay";
import { multiline } from "~/renderer/styles/helpers";
import { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

function StepConfirmation({ t, optimisticOperation, error, signed }: StepProps) {
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage category="Undelegation Cardano" name="Step Confirmed" />
        <SyncOneAccountOnMount priority={10} accountId={optimisticOperation.accountId} />
        <SuccessDisplay
          title={<Trans i18nKey="cardano.unDelegation.flow.steps.confirmation.success.title" />}
          description={multiline(t("cardano.unDelegation.flow.steps.confirmation.success.text"))}
        />
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage category="Undelegation Cardano" name="Step Confirmation Error" />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={<Trans i18nKey="cardano.unDelegation.flow.steps.confirmation.broadcastError" />}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
}

export function StepConfirmationFooter({ onRetry, error, onClose }: StepProps) {
  return (
    <Box horizontal alignItems="right">
      <Button data-testid="modal-close-button" ml={2} onClick={onClose}>
        <Trans i18nKey="common.close" />
      </Button>
      {error ? <RetryButton primary ml={2} onClick={onRetry} /> : null}
    </Box>
  );
}

export default StepConfirmation;
