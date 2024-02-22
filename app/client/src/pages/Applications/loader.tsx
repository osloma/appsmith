import React from "react";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { retryPromise } from "utils/AppsmithUtils";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { connect } from "react-redux";
import { showDebugger } from "actions/debuggerActions";

class ApplicationListLoader extends React.PureComponent<any, { Page: any }> {
  constructor(props: any) {
    super(props);

    this.state = {
      Page: null,
    };
  }

  componentDidMount() {
    //Close debugger call is required because if we import the application page with debugger open
    //it will cause a debugger to open. issue #21xxx
    this.props.closeDebugger();
    PerformanceTracker.stopTracking(PerformanceTransactionName.LOGIN_CLICK);
    AnalyticsUtil.logEvent("APPLICATIONS_PAGE_LOAD");
    retryPromise(async () => {
      console.log("here");
      const mod = await import("@appsmith/pages/Applications");
      return mod;
    })
      .then((module) => {
        console.log("here2", { module });
        this.setState({ Page: module.default });
      })
      .catch((err) => {
        console.log("here catch", { module });
        console.error(err);
      });
  }

  render() {
    const { Page } = this.state;

    return Page ? <Page {...this.props} /> : <PageLoadingBar />;
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  closeDebugger: () => dispatch(showDebugger(false)),
});

export default connect(null, mapDispatchToProps)(ApplicationListLoader);
