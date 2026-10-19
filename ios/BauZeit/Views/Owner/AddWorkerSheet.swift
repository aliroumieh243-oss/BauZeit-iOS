import SwiftUI

struct AddWorkerSheet: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var authVM: AuthViewModel
    
    @State private var name: String = ""
    @State private var email: String = ""
    @State private var workerRateText: String = "12.00"
    @State private var clientRateText: String = "35.00"
    @State private var phone: String = ""
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            Form {
                if let err = errorMessage {
                    Section {
                        Text(err)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                Section("Mitarbeiter-Daten") {
                    TextField("Vollständiger Name", text: $name)
                    TextField("E-Mail Adresse (für Login)", text: $email)
                        #if os(iOS)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        #endif
                    TextField("Telefonnummer (Optional)", text: $phone)
                        #if os(iOS)
                        .keyboardType(.phonePad)
                        #endif
                }
                
                Section("Stundensätze") {
                    HStack {
                        Text("Stundenlohn (€/h):")
                        Spacer()
                        TextField("12.00", text: $workerRateText)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                            #if os(iOS)
                            .keyboardType(.decimalPad)
                            #endif
                    }
                    
                    HStack {
                        Text("Mitarbeiter AR (€/h):")
                        Spacer()
                        TextField("35.00", text: $clientRateText)
                            .multilineTextAlignment(.trailing)
                            .frame(width: 80)
                            #if os(iOS)
                            .keyboardType(.decimalPad)
                            #endif
                    }
                }
            }
            .navigationTitle("Neuen Mitarbeiter anlegen")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern") {
                        saveWorker()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }
    
    private func saveWorker() {
        guard !name.isEmpty, !email.isEmpty else {
            errorMessage = "Bitte Name und E-Mail eingeben."
            return
        }
        let wRate = Double(workerRateText.replacingOccurrences(of: ",", with: ".")) ?? 12.0
        let cRate = Double(clientRateText.replacingOccurrences(of: ",", with: ".")) ?? 35.0
        
        let success = authVM.addNewWorker(
            name: name,
            email: email,
            workerRate: wRate,
            clientRate: cRate,
            phone: phone.isEmpty ? nil : phone
        )
        
        if success {
            dismiss()
        } else {
            errorMessage = "Ein Mitarbeiter mit dieser E-Mail existiert bereits."
        }
    }
}
