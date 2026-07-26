import UIKit
import MapKit

class ViewController: UIViewController, MKMapViewDelegate {

    // MARK: - UI Elements
    private var headerView: UIView!
    private var titleLabel: UILabel!
    private var secureLabel: UILabel!

    private var segmentedControl: UISegmentedControl!

    // Containers
    private var locatorContainer: UIView!
    private var pairingContainer: UIView!
    private var historyContainer: UIView!

    // Locator UI
    private var phoneTextField: UITextField!
    private var searchButton: UIButton!
    private var locatorResultCard: UIView!
    private var locatorResultTitle: UILabel!
    private var locatorResultDetails: UILabel!
    private var locatorRevealButton: UIButton!
    private var locatorMapView: MKMapView!

    // Pairing UI
    private var generatePairingButton: UIButton!
    private var pairingLinkLabel: UILabel!
    private var customMessageTextField: UITextField!
    private var shareButton: UIButton!
    private var autoRefreshButton: UIButton!
    private var pairingStatusLabel: UILabel!
    private var pairingMapView: MKMapView!

    // History UI
    private var exportCSVButton: UIButton!
    private var clearHistoryButton: UIButton!
    private var historyTextView: UITextView!
    private var historyMapView: MKMapView!

    // MARK: - State Variables
    private var isPrivacyMode = true
    private var isRevealed = false
    private var lastLocatedCountry = ""
    private var lastLocatedLat: Double = 0.0
    private var lastLocatedLng: Double = 0.0
    private var lastLocatedCarrier = ""

    private var currentPairId: String? = nil
    private var currentPairLink: String? = nil
    private var isPairPolling = false
    private var pollingTimer: Timer? = nil
    private var currentPairLat: Double = 0.0
    private var currentPairLng: Double = 0.0

    // Offline database fallback
    private let countryFallback: [String: (name: String, code: String, lat: Double, lng: Double, carrier: String)] = [
        "39": ("Italy", "IT", 41.8719, 12.5674, "TIM / Vodafone"),
        "1": ("United States", "US", 37.0902, -95.7129, "T-Mobile / Verizon"),
        "44": ("United Kingdom", "GB", 55.3781, -3.4360, "EE / Vodafone"),
        "33": ("France", "FR", 46.2276, 2.2137, "Orange / SFR"),
        "49": ("Germany", "DE", 51.1657, 10.4515, "Deutsche Telekom"),
        "34": ("Spain", "ES", 40.4637, -3.7492, "Movistar / Vodafone"),
        "81": ("Japan", "JP", 36.2048, 138.2529, "NTT Docomo"),
        "91": ("India", "IN", 20.5937, 78.9629, "Jio / Airtel"),
        "55": ("Brazil", "BR", -14.2350, -51.9253, "Vivo / Claro"),
        "7": ("Russia", "RU", 61.5240, 105.3188, "MTS / Megafon"),
        "61": ("Australia", "AU", -25.2744, 133.7751, "Telstra / Optus"),
        "86": ("China", "CN", 35.8617, 104.1954, "China Mobile")
    ]

    // MARK: - Lifecycle
    override func viewDidLoad() {
        super.viewDidLoad()
        setupThemeAndLayout()
        switchTab(index: 0)
    }

    // MARK: - Setup Views
    private func setupThemeAndLayout() {
        view.backgroundColor = UIColor(red: 2/255, green: 6/255, blue: 23/255, alpha: 1.0) // slate-950

        // Header
        headerView = UIView()
        headerView.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0) // slate-900
        headerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(headerView)

        titleLabel = UILabel()
        titleLabel.text = "MOBTRACK_OS"
        titleLabel.textColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0) // emerald-500
        titleLabel.font = UIFont.monospacedSystemFont(ofSize: 18, weight: .bold)
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        headerView.addSubview(titleLabel)

        secureLabel = UILabel()
        secureLabel.text = "SECURE NATIVE"
        secureLabel.textColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        secureLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .semibold)
        secureLabel.translatesAutoresizingMaskIntoConstraints = false
        headerView.addSubview(secureLabel)

        // Tabs Segmented Control
        segmentedControl = UISegmentedControl(items: ["LOCATOR", "PAIR", "HISTORY"])
        segmentedControl.selectedSegmentIndex = 0
        segmentedControl.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        segmentedControl.tintColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)

        let titleTextAttributes = [NSAttributedString.Key.foregroundColor: UIColor.white]
        let selectedTextAttributes = [NSAttributedString.Key.foregroundColor: UIColor(red: 2/255, green: 6/255, blue: 23/255, alpha: 1.0)]
        segmentedControl.setTitleTextAttributes(titleTextAttributes, for: .normal)
        segmentedControl.setTitleTextAttributes(selectedTextAttributes, for: .selected)
        segmentedControl.selectedSegmentTintColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)

        segmentedControl.addTarget(self, action: #selector(tabChanged(_:)), for: .valueChanged)
        segmentedControl.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(segmentedControl)

        // Setup Containers
        locatorContainer = UIView()
        locatorContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(locatorContainer)
        setupLocatorView()

        pairingContainer = UIView()
        pairingContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(pairingContainer)
        setupPairingView()

        historyContainer = UIView()
        historyContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(historyContainer)
        setupHistoryView()

        // Constraints
        NSLayoutConstraint.activate([
            headerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            headerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            headerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            headerView.heightAnchor.constraint(equalToConstant: 50),

            titleLabel.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: headerView.leadingAnchor, constant: 16),

            secureLabel.centerYAnchor.constraint(equalTo: headerView.centerYAnchor),
            secureLabel.trailingAnchor.constraint(equalTo: headerView.trailingAnchor, constant: -16),

            segmentedControl.topAnchor.constraint(equalTo: headerView.bottomAnchor, constant: 8),
            segmentedControl.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            segmentedControl.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            segmentedControl.heightAnchor.constraint(equalToConstant: 36),

            locatorContainer.topAnchor.constraint(equalTo: segmentedControl.bottomAnchor, constant: 8),
            locatorContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            locatorContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            locatorContainer.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            pairingContainer.topAnchor.constraint(equalTo: segmentedControl.bottomAnchor, constant: 8),
            pairingContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            pairingContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            pairingContainer.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            historyContainer.topAnchor.constraint(equalTo: segmentedControl.bottomAnchor, constant: 8),
            historyContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            historyContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            historyContainer.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    @objc private func tabChanged(_ sender: UISegmentedControl) {
        switchTab(index: sender.selectedSegmentIndex)
    }

    private func switchTab(index: Int) {
        locatorContainer.isHidden = index != 0
        pairingContainer.isHidden = index != 1
        historyContainer.isHidden = index != 2

        if index == 2 {
            loadHistoryList()
        }
    }

    // MARK: - Locator Layout
    private func setupLocatorView() {
        phoneTextField = UITextField()
        phoneTextField.placeholder = "+39 333 123 4567"
        phoneTextField.textColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        phoneTextField.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        phoneTextField.font = UIFont.monospacedSystemFont(ofSize: 14, weight: .medium)
        phoneTextField.borderStyle = .none
        phoneTextField.layer.cornerRadius = 8
        phoneTextField.setLeftPaddingPoints(12)
        phoneTextField.translatesAutoresizingMaskIntoConstraints = false
        locatorContainer.addSubview(phoneTextField)

        searchButton = UIButton(type: .system)
        searchButton.setTitle("INITIATE LOCATOR", for: .normal)
        searchButton.setTitleColor(UIColor(red: 2/255, green: 6/255, blue: 23/255, alpha: 1.0), for: .normal)
        searchButton.backgroundColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        searchButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 13, weight: .bold)
        searchButton.layer.cornerRadius = 8
        searchButton.addTarget(self, action: #selector(performLookup), for: .touchUpInside)
        searchButton.translatesAutoresizingMaskIntoConstraints = false
        locatorContainer.addSubview(searchButton)

        locatorResultCard = UIView()
        locatorResultCard.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        locatorResultCard.layer.cornerRadius = 8
        locatorResultCard.isHidden = true
        locatorResultCard.translatesAutoresizingMaskIntoConstraints = false
        locatorContainer.addSubview(locatorResultCard)

        locatorResultTitle = UILabel()
        locatorResultTitle.textColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        locatorResultTitle.font = UIFont.monospacedSystemFont(ofSize: 13, weight: .bold)
        locatorResultTitle.translatesAutoresizingMaskIntoConstraints = false
        locatorResultCard.addSubview(locatorResultTitle)

        locatorResultDetails = UILabel()
        locatorResultDetails.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        locatorResultDetails.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .medium)
        locatorResultDetails.numberOfLines = 0
        locatorResultDetails.translatesAutoresizingMaskIntoConstraints = false
        locatorResultCard.addSubview(locatorResultDetails)

        locatorRevealButton = UIButton(type: .system)
        locatorRevealButton.setTitle("REVEAL", for: .normal)
        locatorRevealButton.setTitleColor(UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0), for: .normal)
        locatorRevealButton.backgroundColor = UIColor(red: 30/255, green: 41/255, blue: 59/255, alpha: 1.0)
        locatorRevealButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .bold)
        locatorRevealButton.layer.cornerRadius = 4
        locatorRevealButton.addTarget(self, action: #selector(revealCoords), for: .touchUpInside)
        locatorRevealButton.translatesAutoresizingMaskIntoConstraints = false
        locatorResultCard.addSubview(locatorRevealButton)

        locatorMapView = MKMapView()
        locatorMapView.delegate = self
        locatorMapView.translatesAutoresizingMaskIntoConstraints = false
        locatorContainer.addSubview(locatorMapView)

        // Constraints
        NSLayoutConstraint.activate([
            phoneTextField.topAnchor.constraint(equalTo: locatorContainer.topAnchor, constant: 16),
            phoneTextField.leadingAnchor.constraint(equalTo: locatorContainer.leadingAnchor, constant: 16),
            phoneTextField.trailingAnchor.constraint(equalTo: locatorContainer.trailingAnchor, constant: -16),
            phoneTextField.heightAnchor.constraint(equalToConstant: 44),

            searchButton.topAnchor.constraint(equalTo: phoneTextField.bottomAnchor, constant: 12),
            searchButton.leadingAnchor.constraint(equalTo: locatorContainer.leadingAnchor, constant: 16),
            searchButton.trailingAnchor.constraint(equalTo: locatorContainer.trailingAnchor, constant: -16),
            searchButton.heightAnchor.constraint(equalToConstant: 44),

            locatorResultCard.topAnchor.constraint(equalTo: searchButton.bottomAnchor, constant: 16),
            locatorResultCard.leadingAnchor.constraint(equalTo: locatorContainer.leadingAnchor, constant: 16),
            locatorResultCard.trailingAnchor.constraint(equalTo: locatorContainer.trailingAnchor, constant: -16),

            locatorResultTitle.topAnchor.constraint(equalTo: locatorResultCard.topAnchor, constant: 12),
            locatorResultTitle.leadingAnchor.constraint(equalTo: locatorResultCard.leadingAnchor, constant: 12),
            locatorResultTitle.trailingAnchor.constraint(equalTo: locatorResultCard.trailingAnchor, constant: -12),

            locatorResultDetails.topAnchor.constraint(equalTo: locatorResultTitle.bottomAnchor, constant: 6),
            locatorResultDetails.leadingAnchor.constraint(equalTo: locatorResultCard.leadingAnchor, constant: 12),
            locatorResultDetails.trailingAnchor.constraint(equalTo: locatorResultCard.trailingAnchor, constant: -12),

            locatorRevealButton.topAnchor.constraint(equalTo: locatorResultDetails.bottomAnchor, constant: 8),
            locatorRevealButton.leadingAnchor.constraint(equalTo: locatorResultCard.leadingAnchor, constant: 12),
            locatorRevealButton.heightAnchor.constraint(equalToConstant: 30),
            locatorRevealButton.widthAnchor.constraint(equalToConstant: 80),
            locatorRevealButton.bottomAnchor.constraint(equalTo: locatorResultCard.bottomAnchor, constant: -12),

            locatorMapView.topAnchor.constraint(equalTo: locatorResultCard.bottomAnchor, constant: 16),
            locatorMapView.leadingAnchor.constraint(equalTo: locatorContainer.leadingAnchor, constant: 16),
            locatorMapView.trailingAnchor.constraint(equalTo: locatorContainer.trailingAnchor, constant: -16),
            locatorMapView.bottomAnchor.constraint(equalTo: locatorContainer.bottomAnchor, constant: -16)
        ])
    }

    @objc private func performLookup() {
        guard let phone = phoneTextField.text, !phone.isEmpty else { return }

        let cleanPhone = phone.replacingOccurrences(of: "[^0-9+]", with: "", options: .regularExpression)

        var match: (name: String, code: String, lat: Double, lng: Double, carrier: String)? = nil
        for (code, item) in countryFallback {
            if cleanPhone.hasPrefix("+" + code) || cleanPhone.hasPrefix(code) {
                match = item
                break
            }
        }

        let country = match?.name ?? "Global Triangulation"
        let lat = match?.lat ?? 0.0
        let lng = match?.lng ?? 0.0
        let carrier = match?.carrier ?? "Unknown Operator"

        lastLocatedCountry = country
        lastLocatedLat = lat
        lastLocatedLng = lng
        lastLocatedCarrier = carrier
        isRevealed = false

        locatorResultCard.isHidden = false
        updateLocatorResultCard()
    }

    private func updateLocatorResultCard() {
        locatorResultTitle.text = "LOCATION LOCKED: " + lastLocatedCountry.uppercased()

        var details = "Carrier: \(lastLocatedCarrier)\n"
        if isPrivacyMode && !isRevealed {
            details += "LAT: [REDACTED]\nLNG: [REDACTED]"
            locatorRevealButton.isHidden = false
        } else {
            details += "LAT: \(String(format: "%.4f", lastLocatedLat))\nLNG: \(String(format: "%.4f", lastLocatedLng))"
            locatorRevealButton.isHidden = true
        }

        locatorResultDetails.text = details

        // MapKit update
        let coords = CLLocationCoordinate2D(latitude: lastLocatedLat, longitude: lastLocatedLng)
        let region = MKCoordinateRegion(center: coords, latitudinalMeters: 500000, longitudinalMeters: 500000)
        locatorMapView.setRegion(region, animated: true)

        locatorMapView.removeAnnotations(locatorMapView.annotations)
        let annotation = MKPointAnnotation()
        annotation.coordinate = coords
        annotation.title = lastLocatedCountry
        locatorMapView.addAnnotation(annotation)
    }

    @objc private func revealCoords() {
        isRevealed = true
        updateLocatorResultCard()
    }

    // MARK: - Pairing Layout
    private func setupPairingView() {
        generatePairingButton = UIButton(type: .system)
        generatePairingButton.setTitle("GENERATE PAIRING LINK", for: .normal)
        generatePairingButton.setTitleColor(UIColor.white, for: .normal)
        generatePairingButton.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        generatePairingButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 13, weight: .bold)
        generatePairingButton.layer.cornerRadius = 8
        generatePairingButton.addTarget(self, action: #selector(generateLink), for: .touchUpInside)
        generatePairingButton.translatesAutoresizingMaskIntoConstraints = false
        pairingContainer.addSubview(generatePairingButton)

        pairingLinkLabel = UILabel()
        pairingLinkLabel.textColor = UIColor(red: 100/255, green: 116/255, blue: 139/255, alpha: 1.0)
        pairingLinkLabel.font = UIFont.monospacedSystemFont(ofSize: 10, weight: .medium)
        pairingLinkLabel.textAlignment = .center
        pairingLinkLabel.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        pairingLinkLabel.layer.cornerRadius = 4
        pairingLinkLabel.layer.masksToBounds = true
        pairingLinkLabel.translatesAutoresizingMaskIntoConstraints = false
        pairingContainer.addSubview(pairingLinkLabel)

        customMessageTextField = UITextField()
        customMessageTextField.text = "I invite you to share your live location via MobTrack. Tap here to accept:"
        customMessageTextField.textColor = UIColor.white
        customMessageTextField.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        customMessageTextField.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .regular)
        customMessageTextField.borderStyle = .none
        customMessageTextField.layer.cornerRadius = 8
        customMessageTextField.setLeftPaddingPoints(12)
        customMessageTextField.translatesAutoresizingMaskIntoConstraints = false
        pairingContainer.addSubview(customMessageTextField)

        shareButton = UIButton(type: .system)
        shareButton.setTitle("SHARE INVITATION LINK", for: .normal)
        shareButton.setTitleColor(UIColor(red: 2/255, green: 6/255, blue: 23/255, alpha: 1.0), for: .normal)
        shareButton.backgroundColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        shareButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .bold)
        shareButton.layer.cornerRadius = 8
        shareButton.addTarget(self, action: #selector(shareInvitation), for: .touchUpInside)
        shareButton.translatesAutoresizingMaskIntoConstraints = false
        pairingContainer.addSubview(shareButton)

        autoRefreshButton = UIButton(type: .system)
        autoRefreshButton.setTitle("STOP ACTIVE POLLING", for: .normal)
        autoRefreshButton.setTitleColor(UIColor.white, for: .normal)
        autoRefreshButton.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0) // red
        autoRefreshButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .bold)
        autoRefreshButton.layer.cornerRadius = 8
        autoRefreshButton.isHidden = true
        autoRefreshButton.addTarget(self, action: #selector(togglePolling), for: .touchUpInside)
        autoRefreshButton.translatesAutoresizingMaskIntoConstraints = false
        pairingContainer.addSubview(autoRefreshButton)

        pairingStatusLabel = UILabel()
        pairingStatusLabel.text = "AWAITING ACTIVE UPLINK..."
        pairingStatusLabel.textColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
        pairingStatusLabel.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .bold)
        pairingStatusLabel.textAlignment = .center
        pairingStatusLabel.translatesAutoresizingMaskIntoConstraints = false
        pairingContainer.addSubview(pairingStatusLabel)

        pairingMapView = MKMapView()
        pairingMapView.delegate = self
        pairingMapView.translatesAutoresizingMaskIntoConstraints = false
        pairingContainer.addSubview(pairingMapView)

        NSLayoutConstraint.activate([
            generatePairingButton.topAnchor.constraint(equalTo: pairingContainer.topAnchor, constant: 16),
            generatePairingButton.leadingAnchor.constraint(equalTo: pairingContainer.leadingAnchor, constant: 16),
            generatePairingButton.trailingAnchor.constraint(equalTo: pairingContainer.trailingAnchor, constant: -16),
            generatePairingButton.heightAnchor.constraint(equalToConstant: 44),

            pairingLinkLabel.topAnchor.constraint(equalTo: generatePairingButton.bottomAnchor, constant: 8),
            pairingLinkLabel.leadingAnchor.constraint(equalTo: pairingContainer.leadingAnchor, constant: 16),
            pairingLinkLabel.trailingAnchor.constraint(equalTo: pairingContainer.trailingAnchor, constant: -16),
            pairingLinkLabel.heightAnchor.constraint(equalToConstant: 30),

            customMessageTextField.topAnchor.constraint(equalTo: pairingLinkLabel.bottomAnchor, constant: 8),
            customMessageTextField.leadingAnchor.constraint(equalTo: pairingContainer.leadingAnchor, constant: 16),
            customMessageTextField.trailingAnchor.constraint(equalTo: pairingContainer.trailingAnchor, constant: -16),
            customMessageTextField.heightAnchor.constraint(equalToConstant: 44),

            shareButton.topAnchor.constraint(equalTo: customMessageTextField.bottomAnchor, constant: 12),
            shareButton.leadingAnchor.constraint(equalTo: pairingContainer.leadingAnchor, constant: 16),
            shareButton.trailingAnchor.constraint(equalTo: pairingContainer.trailingAnchor, constant: -16),
            shareButton.heightAnchor.constraint(equalToConstant: 44),

            autoRefreshButton.topAnchor.constraint(equalTo: shareButton.bottomAnchor, constant: 8),
            autoRefreshButton.leadingAnchor.constraint(equalTo: pairingContainer.leadingAnchor, constant: 16),
            autoRefreshButton.trailingAnchor.constraint(equalTo: pairingContainer.trailingAnchor, constant: -16),
            autoRefreshButton.heightAnchor.constraint(equalToConstant: 44),

            pairingStatusLabel.topAnchor.constraint(equalTo: autoRefreshButton.bottomAnchor, constant: 12),
            pairingStatusLabel.leadingAnchor.constraint(equalTo: pairingContainer.leadingAnchor, constant: 16),
            pairingStatusLabel.trailingAnchor.constraint(equalTo: pairingContainer.trailingAnchor, constant: -16),

            pairingMapView.topAnchor.constraint(equalTo: pairingStatusLabel.bottomAnchor, constant: 16),
            pairingMapView.leadingAnchor.constraint(equalTo: pairingContainer.leadingAnchor, constant: 16),
            pairingMapView.trailingAnchor.constraint(equalTo: pairingContainer.trailingAnchor, constant: -16),
            pairingMapView.bottomAnchor.constraint(equalTo: pairingContainer.bottomAnchor, constant: -16)
        ])
    }

    @objc private func generateLink() {
        currentPairId = String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(16))
        currentPairLink = "https://gents83.github.io/MobTracker/?pair=\(currentPairId!)"

        pairingLinkLabel.text = currentPairLink
        autoRefreshButton.isHidden = false

        isPairPolling = true
        autoRefreshButton.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
        autoRefreshButton.setTitle("STOP ACTIVE POLLING", for: .normal)

        startTimer()
    }

    @objc private func shareInvitation() {
        guard let link = currentPairLink else { return }
        let msg = customMessageTextField.text ?? ""
        let shareText = "\(msg) \(link)"

        let activityVC = UIActivityViewController(activityItems: [shareText], applicationActivities: nil)
        present(activityVC, animated: true, completion: nil)
    }

    @objc private func togglePolling() {
        if isPairPolling {
            isPairPolling = false
            autoRefreshButton.backgroundColor = UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0)
            autoRefreshButton.setTitle("START ACTIVE POLLING", for: .normal)
            pairingStatusLabel.text = "POLLING SUSPENDED"
            stopTimer()
        } else {
            isPairPolling = true
            autoRefreshButton.backgroundColor = UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0)
            autoRefreshButton.setTitle("STOP ACTIVE POLLING", for: .normal)
            pairingStatusLabel.text = "AWAITING INCOMING UPLINK..."
            startTimer()
        }
    }

    private func startTimer() {
        stopTimer()
        pollingTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            self?.pollNtfy()
        }
    }

    private func stopTimer() {
        pollingTimer?.invalidate()
        pollingTimer = nil
    }

    private func pollNtfy() {
        guard let pId = currentPairId else { return }
        let urlStr = "https://ntfy.sh/mobtrack-pair-\(pId)/json?poll=1"
        guard let url = URL(string: urlStr) else { return }

        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            guard let data = data, error == nil else { return }

            let str = String(data: data, encoding: .utf8) ?? ""
            let lines = str.components(separatedBy: "\n")

            var matchedLat: Double = 0.0
            var matchedLng: Double = 0.0
            var found = false

            for line in lines {
                guard let lineData = line.data(using: .utf8) else { continue }
                if let json = try? JSONSerialization.jsonObject(with: lineData, options: []) as? [String: Any],
                   let event = json["event"] as? String, event == "message",
                   let msgStr = json["message"] as? String,
                   let msgData = msgStr.data(using: .utf8),
                   let msgJson = try? JSONSerialization.jsonObject(with: msgData, options: []) as? [String: Any],
                   let lt = msgJson["lat"] as? Double,
                   let lg = msgJson["lng"] as? Double {
                    matchedLat = lt
                    matchedLng = lg
                    found = true
                }
            }

            if found {
                DispatchQueue.main.async {
                    self?.handlePairUpdate(lat: matchedLat, lng: matchedLng)
                }
            }
        }.resume()
    }

    private func handlePairUpdate(lat: Double, lng: Double) {
        if lat == currentPairLat && lng == currentPairLng { return }
        currentPairLat = lat
        currentPairLng = lng

        pairingStatusLabel.text = "UPLINK ACTIVE\nLAT: \(String(format: "%.4f", lat)) | LNG: \(String(format: "%.4f", lng))"

        let coords = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        let region = MKCoordinateRegion(center: coords, latitudinalMeters: 2000, longitudinalMeters: 2000)
        pairingMapView.setRegion(region, animated: true)

        pairingMapView.removeAnnotations(pairingMapView.annotations)
        let annotation = MKPointAnnotation()
        annotation.coordinate = coords
        annotation.title = "Paired Device"
        pairingMapView.addAnnotation(annotation)

        // Log history
        if let pId = currentPairId {
            saveHistoryLog(sessionId: pId, lat: lat, lng: lng)
        }
    }

    // MARK: - History Layout
    private func setupHistoryView() {
        exportCSVButton = UIButton(type: .system)
        exportCSVButton.setTitle("EXPORT CSV", for: .normal)
        exportCSVButton.setTitleColor(UIColor(red: 16/255, green: 185/255, blue: 129/255, alpha: 1.0), for: .normal)
        exportCSVButton.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        exportCSVButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .bold)
        exportCSVButton.layer.cornerRadius = 8
        exportCSVButton.addTarget(self, action: #selector(exportHistory), for: .touchUpInside)
        exportCSVButton.translatesAutoresizingMaskIntoConstraints = false
        historyContainer.addSubview(exportCSVButton)

        clearHistoryButton = UIButton(type: .system)
        clearHistoryButton.setTitle("CLEAR HISTORY", for: .normal)
        clearHistoryButton.setTitleColor(UIColor(red: 239/255, green: 68/255, blue: 68/255, alpha: 1.0), for: .normal)
        clearHistoryButton.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        clearHistoryButton.titleLabel?.font = UIFont.monospacedSystemFont(ofSize: 12, weight: .bold)
        clearHistoryButton.layer.cornerRadius = 8
        clearHistoryButton.addTarget(self, action: #selector(clearLogs), for: .touchUpInside)
        clearHistoryButton.translatesAutoresizingMaskIntoConstraints = false
        historyContainer.addSubview(clearHistoryButton)

        historyTextView = UITextView()
        historyTextView.isEditable = false
        historyTextView.textColor = UIColor(red: 148/255, green: 163/255, blue: 184/255, alpha: 1.0)
        historyTextView.backgroundColor = UIColor(red: 15/255, green: 23/255, blue: 42/255, alpha: 1.0)
        historyTextView.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .medium)
        historyTextView.layer.cornerRadius = 8
        historyTextView.translatesAutoresizingMaskIntoConstraints = false
        historyContainer.addSubview(historyTextView)

        historyMapView = MKMapView()
        historyMapView.delegate = self
        historyMapView.translatesAutoresizingMaskIntoConstraints = false
        historyContainer.addSubview(historyMapView)

        NSLayoutConstraint.activate([
            exportCSVButton.topAnchor.constraint(equalTo: historyContainer.topAnchor, constant: 16),
            exportCSVButton.leadingAnchor.constraint(equalTo: historyContainer.leadingAnchor, constant: 16),
            exportCSVButton.widthAnchor.constraint(equalTo: historyContainer.widthAnchor, multiplier: 0.45),
            exportCSVButton.heightAnchor.constraint(equalToConstant: 44),

            clearHistoryButton.topAnchor.constraint(equalTo: historyContainer.topAnchor, constant: 16),
            clearHistoryButton.trailingAnchor.constraint(equalTo: historyContainer.trailingAnchor, constant: -16),
            clearHistoryButton.widthAnchor.constraint(equalTo: historyContainer.widthAnchor, multiplier: 0.45),
            clearHistoryButton.heightAnchor.constraint(equalToConstant: 44),

            historyTextView.topAnchor.constraint(equalTo: exportCSVButton.bottomAnchor, constant: 16),
            historyTextView.leadingAnchor.constraint(equalTo: historyContainer.leadingAnchor, constant: 16),
            historyTextView.trailingAnchor.constraint(equalTo: historyContainer.trailingAnchor, constant: -16),
            historyTextView.heightAnchor.constraint(equalToConstant: 120),

            historyMapView.topAnchor.constraint(equalTo: historyTextView.bottomAnchor, constant: 16),
            historyMapView.leadingAnchor.constraint(equalTo: historyContainer.leadingAnchor, constant: 16),
            historyMapView.trailingAnchor.constraint(equalTo: historyContainer.trailingAnchor, constant: -16),
            historyMapView.bottomAnchor.constraint(equalTo: historyContainer.bottomAnchor, constant: -16)
        ])
    }

    private func saveHistoryLog(sessionId: String, lat: Double, lng: Double) {
        let key = "locationHistory"
        var list = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []
        let item: [String: Any] = [
            "session_id": sessionId,
            "lat": lat,
            "lng": lng,
            "timestamp": Date().timeIntervalSince1970
        ]
        list.append(item)
        UserDefaults.standard.set(list, forKey: key)
    }

    private func loadHistoryList() {
        let key = "locationHistory"
        let list = UserDefaults.standard.array(forKey: key) as? [[String: Any]] ?? []

        if list.isEmpty {
            historyTextView.text = "No history logs recorded yet."
            return
        }

        var displayStr = ""
        historyMapView.removeAnnotations(historyMapView.annotations)

        for (idx, item) in list.enumerated() {
            let sId = item["session_id"] as? String ?? ""
            let lat = item["lat"] as? Double ?? 0.0
            let lng = item["lng"] as? Double ?? 0.0

            displayStr += "[\(idx + 1)] SESSION: \(sId.prefix(8).uppercased())\n    Lat: \(String(format: "%.4f", lat)) | Lng: \(String(format: "%.4f", lng))\n\n"

            let anno = MKPointAnnotation()
            anno.coordinate = CLLocationCoordinate2D(latitude: lat, longitude: lng)
            anno.title = "Point \(idx + 1)"
            historyMapView.addAnnotation(anno)

            if idx == list.count - 1 {
                let region = MKCoordinateRegion(center: anno.coordinate, latitudinalMeters: 50000, longitudinalMeters: 50000)
                historyMapView.setRegion(region, animated: true)
            }
        }

        historyTextView.text = displayStr
    }

    @objc private func clearLogs() {
        UserDefaults.standard.removeObject(forKey: "locationHistory")
        loadHistoryList()
        historyMapView.removeAnnotations(historyMapView.annotations)
    }

    @objc private func exportHistory() {
        let list = UserDefaults.standard.array(forKey: "locationHistory") as? [[String: Any]] ?? []
        if list.isEmpty { return }

        var csv = "Session ID,Latitude,Longitude,Timestamp\n"
        for item in list {
            let sId = item["session_id"] as? String ?? ""
            let lat = item["lat"] as? Double ?? 0.0
            let lng = item["lng"] as? Double ?? 0.0
            let ts = item["timestamp"] as? Double ?? 0.0

            csv += "\(sId),\(lat),\(lng),\(ts)\n"
        }

        let activityVC = UIActivityViewController(activityItems: [csv], applicationActivities: nil)
        present(activityVC, animated: true, completion: nil)
    }
}

// MARK: - Padding Helpers
extension UITextField {
    func setLeftPaddingPoints(_ amount:CGFloat){
        let paddingView = UIView(frame: CGRect(x: 0, y: 0, width: amount, height: self.frame.size.height))
        self.leftView = paddingView
        self.leftViewMode = .always
    }
}
