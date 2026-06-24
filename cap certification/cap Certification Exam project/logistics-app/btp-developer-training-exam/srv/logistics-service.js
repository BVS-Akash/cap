const cds = require('@sap/cds')

module.exports = class LogisticsService extends cds.ApplicationService {

    async init() {

        const { Shipments, Packages } = this.entities

        const RATES = { A: 15, S: 5, R: 8 }

        this.after('READ', 'Shipments', async (shipments) => {

            // normalize to array — single reads return an object
            const list = Array.isArray(shipments) ? shipments : [shipments]

            for (const shipment of list) {

                // if packages weren't expanded in the request, fetch them manually
                if (!shipment.packages) {
                    shipment.packages = await SELECT.from(Packages)
                        .where({ parent_ID: shipment.ID })
                }

                // calculate totalWeight
                shipment.totalWeight = shipment.packages.reduce(
                    (sum, pkg) => sum + (pkg.weight || 0), 0
                )

                // calculate shippingFee using transport mode rate
                const rate = RATES[shipment.mode] ?? 0
                shipment.shippingFee = shipment.totalWeight * rate
            }
        })

        return super.init()
    }
}