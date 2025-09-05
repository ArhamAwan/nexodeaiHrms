import { Suspense } from "react";
import EmployeesClient from "./EmployeesClient";

export default function EmployeesPage() {
	return (
		<Suspense>
			<EmployeesClient />
		</Suspense>
	);
}
