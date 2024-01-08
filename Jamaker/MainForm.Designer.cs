using System.Windows.Forms;

namespace Jamaker
{
    partial class MainForm
    {
        /// <summary>
        /// 필수 디자이너 변수입니다.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// 사용 중인 모든 리소스를 정리합니다.
        /// </summary>
        /// <param name="disposing">관리되는 리소스를 삭제해야 하면 true이고, 그렇지 않으면 false입니다.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form 디자이너에서 생성한 코드

        /// <summary>
        /// 디자이너 지원에 필요한 메서드입니다. 
        /// 이 메서드의 내용을 코드 편집기로 수정하지 마세요.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(MainForm));
            this.menuStrip = new System.Windows.Forms.MenuStrip();
            this.layerForDrag = new Jamaker.TransparentPanel();
            this.timer = new System.Windows.Forms.Timer(this.components);
            this.mainView = new Jamaker.WebView();
            this.SuspendLayout();
            // 
            // menuStrip
            // 
            this.menuStrip.Location = new System.Drawing.Point(0, 0);
            this.menuStrip.Name = "menuStrip";
            this.menuStrip.Size = new System.Drawing.Size(800, 24);
            this.menuStrip.TabIndex = 1;
            this.menuStrip.Text = "menuStrip";
            this.menuStrip.MenuDeactivate += new System.EventHandler(this.EscapeMenuFocusAfterCheck);
            this.menuStrip.KeyDown += new System.Windows.Forms.KeyEventHandler(this.KeyDownInMenuStrip);
            this.menuStrip.LostFocus += new System.EventHandler(this.CloseMenuStrip);
            // 
            // layerForDrag
            // 
            this.layerForDrag.AllowDrop = true;
            this.layerForDrag.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.layerForDrag.BackColor = System.Drawing.SystemColors.ActiveCaption;
            this.layerForDrag.Location = new System.Drawing.Point(0, 24);
            this.layerForDrag.Name = "layerForDrag";
            this.layerForDrag.Size = new System.Drawing.Size(800, 426);
            this.layerForDrag.TabIndex = 7;
            this.layerForDrag.Visible = false;
            this.layerForDrag.DragDrop += new System.Windows.Forms.DragEventHandler(this.DragDropMain);
            this.layerForDrag.DragOver += new System.Windows.Forms.DragEventHandler(this.DragOverMain);
            this.layerForDrag.DragLeave += new System.EventHandler(this.DragLeaveMain);
            // 
            // mainView
            // 
            this.mainView.ActivateBrowserOnCreation = false;
            this.mainView.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.mainView.Location = new System.Drawing.Point(0, 24);
            this.mainView.Margin = new System.Windows.Forms.Padding(0);
            this.mainView.Name = "mainView";
            this.mainView.Size = new System.Drawing.Size(800, 426);
            this.mainView.TabIndex = 5;
            // 
            // MainForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 12F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.layerForDrag);
            this.Controls.Add(this.menuStrip);
            this.Controls.Add(this.mainView);
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.MainMenuStrip = this.menuStrip;
            this.MaximizeBox = false;
            this.Name = "MainForm";
            this.Text = "Jamaker";
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        protected WebView mainView;
        protected TransparentPanel layerForDrag;
        protected Timer timer;
        private MenuStrip menuStrip;

        private MouseEventHandler clickMenuStrip;
    }
}

