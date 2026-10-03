import { lazy, useEffect } from "react";
import { Route, Switch } from "wouter";
import ReactGA from "react-ga4";
import AppShell, { BOOKING_ROUTE, PUBLIC_ROUTE, withSecurity } from "./AppShell";

const Home = lazy(() => import("@/pages/home"));
const Activities = lazy(() => import("@/pages/activities"));
const SimplifiedActivities = lazy(() => import("@/pages/simplified-activities"));
const ActivityDetail = lazy(() => import("@/pages/activity-detail"));
const Booking = lazy(() => import("@/pages/booking-fixed"));
const BookingConfirmationPage = lazy(() => import("@/components/booking-confirmation-page"));
const Reviews = lazy(() => import("@/pages/reviews"));
const Contact = lazy(() => import("@/pages/contact"));
const CustomerPortal = lazy(() => import("@/pages/customer-portal"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={withSecurity(Home, PUBLIC_ROUTE)} />
      <Route path="/activities" component={withSecurity(Activities, PUBLIC_ROUTE)} />
      <Route path="/activities-simple" component={withSecurity(SimplifiedActivities, PUBLIC_ROUTE)} />
      <Route path="/activity/:id" component={withSecurity(ActivityDetail, PUBLIC_ROUTE)} />
      <Route path="/booking" component={withSecurity(Booking, BOOKING_ROUTE)} />
      <Route path="/confirmation-and-pay" component={withSecurity(BookingConfirmationPage, BOOKING_ROUTE)} />
      <Route path="/reviews" component={withSecurity(Reviews, PUBLIC_ROUTE)} />
      <Route path="/contact" component={withSecurity(Contact, PUBLIC_ROUTE)} />
      <Route path="/customer" component={withSecurity(CustomerPortal, PUBLIC_ROUTE)} />
      <Route component={withSecurity(NotFound, PUBLIC_ROUTE)} />
    </Switch>
  );
}

export default function PublicApp() {
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && import.meta.env.PROD) ReactGA.initialize(gaId);
  }, []);
  return <AppShell><PublicRouter /></AppShell>;
}
